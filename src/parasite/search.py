from flask import request
import json
import re
from collections import OrderedDict


class SearchRepository(type):
    """
    Meta class used to register a Search class.
    A class that uses this metaclass must have a member
    called "APP_NAME" specifying the application name.
    This must be the same name used by the application
    object (at creation time) in the client side code.
    """

    _APP_NAME = 'APP_NAME'

    _app_to_search = {}

    def __new__(cls, name, bases, dct):
        created_class = super(SearchRepository, cls).__new__(cls, name, bases, dct)

        app_name = dct.get(SearchRepository._APP_NAME)

        if app_name is None:
            if bases[0] != object:
                raise Exception(SearchRepository._APP_NAME + " must be defined")
        else:
            SearchRepository._app_to_search[app_name] = created_class

        return created_class

    @staticmethod
    def get(app_name):
        return SearchRepository._app_to_search.get(app_name)


class SearchItems(object):
    """
    This class holds the search items stored in the user's search query.
    Each search item has a filter, an operation and a value, e.g. "ID = 123"
    is translated to filter = "ID", operator = "=", value = "123".
    """

    class Item(object):
        _OPERATOR_TOKENS = "!=<>"

        def __init__(self, filter, operator, value, space1 = None, space2 = None):
            self.filter = filter
            self.space1 = space1
            self.operator = operator
            self.space2 = space2
            self.value = value

        @staticmethod
        def from_str(s):
            word = "([^ " + SearchItems.Item._OPERATOR_TOKENS + "]*)"
            match = re.match("^" + word + "( *)((?:" + "|".join(SearchItems.Item._OPERATOR_TOKENS) + ")*)( *)" + word + "$", s)
            if match is None:
                return None

            filter, space1, operator, space2, value = match.groups()
            if operator is None:
                operator = ""

            return SearchItems.Item(filter, operator, value, space1, space2)

    def __init__(self, items):
        self._filter_to_item = {item.filter : item for item in items}
        if len(self._filter_to_item) != len(items):
            raise Exception("repetition of search item filters is not allowed")

    def has_filter(self, filter_name):
        """
        @return: True iff there's a search item with the given filter.
        """
        return self._filter_to_item.has_key(filter_name)

    def get_operator(self, filter_name):
        """
        @return: the operator of the search item with the given filter,
                 or None if there's no such search item.
        """

        item = self._filter_to_item.get(filter_name)
        if item is None:
            return None

        return str(item.operator)

    def get_value(self, filter_name):
        """
        @return: the value of the search item with the given filter,
                 or None if there's no such search item.
        """

        item = self._filter_to_item.get(filter_name)
        if item is None:
            return None

        return str(item.value)


class Search(object):

    __metaclass__ = SearchRepository

    @classmethod
    def get(cls, q, selected_search_options):
        s = SearchItems.Item.from_str(q)

        if s is None or s.operator == "" and s.value != "":
            return []

        options = cls._get_level([s.filter, s.operator, s.value],
                                 [s.space1, s.space2, ''],
                                 selected_search_options)

        return [(id, text) for text, id in list(OrderedDict([(text, id) for id, text in options]).iteritems())]

    @classmethod
    def _get_level(cls, parts, post_delimiters, selected_search_options, level_index = 0):
        def create_full_option(parts, post_delimiters, selected_search_options):
            if selected_search_options.has_filter(parts[0]):
                return None
            else:
                return ({"filter" : parts[0],
                         "operator" : parts[1] if len(parts) > 1 else None,
                         "value" : parts[2] if len(parts) > 2 else None},
                        "".join(["".join(x) for x in zip(parts, post_delimiters)]))

        # Note: "level" is one of the three parts of a search option (e.g. 'a' '=' 'b')

        retrievers = [cls._get_available_filters,
                      cls._get_available_operators,
                      cls._get_available_values,
                      None]

        options_retriever = retrievers[level_index]

        if options_retriever is None:
            # We passed the last level - we found a valid search:
            full_option = create_full_option(parts, post_delimiters, selected_search_options)
            if full_option is None:
                return []
            return [full_option]

        # Get the options for the current level:
        level_options = options_retriever(*parts)

        if len(level_options) == 0:
            # No search options at all:
            return []

        res = []
        level_part = parts[level_index]

        if post_delimiters[level_index] != '':
            # A space was entered after level_part, meaning - the user isn't
            # interested of options starting with level_part. level_part is
            # the only option for him:
            if level_part in level_options:
                level_options = [level_part]
            else:
                level_options = []

        if level_part in level_options:
            # level_part is a while option (and not only a prefix).
            # Go to the next level:
            level_options.remove(level_part)
            res += cls._get_level(parts,
                                  post_delimiters,
                                  selected_search_options,
                                  level_index + 1)

        if level_index == len(parts) - 1 or parts[level_index + 1] == "":
            # Create options from what we've got so far:
            res += filter(lambda option : option != None,
                          [create_full_option(parts[:level_index] + [level_option],
                                              post_delimiters,
                                              selected_search_options)
                           for level_option in level_options])

        return res

    @classmethod
    def _get_available_filters(cls, filter_prefix, operator, value):
        return [filter
                for filter in cls._get_filters()
                if filter.startswith(filter_prefix)]

    @classmethod
    def _get_available_operators(cls, filter, operator_prefix, value):
        return [operator
                for operator in cls._get_operators(filter)
                if operator.startswith(operator_prefix)]

    @classmethod
    def _get_available_values(cls, filter, operator, value_prefix):
        return cls._get_values(filter, operator, value_prefix)

    @classmethod
    def _get_filters(cls):
        raise NotImplementedError()

    @classmethod
    def _get_operators(cls, filter):
        raise NotImplementedError()

    @classmethod
    def _get_values(cls, filter, operator, value_prefix):
        raise NotImplementedError()


def get_search_query(url_argument = "q"):
    """
    Get the search items of the user search query.

    @param url_argument: the name of the argument in the URL containing the search query.
    @type url_argument: str.
    @rtype: SearchItems.
    """

    k = request.args.getlist(url_argument)
    if k != ['']:
        res = SearchItems([SearchItems.Item(**json.loads(s)) for s in k])
    else:
        res = SearchItems()

    return res