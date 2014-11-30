import os
import traceback
import importlib
from utils.log import logger


class _Init(object):
    """
    This class holds all of the code that should run during
    the initialization of the site.
    The difference between code which is registered here and code which is
    written in the __init__.py of the applications is that code registered here
    is run only once, while the other code runs once per process which runs the
    parasite server (e.g. the parasite production server has several such
    processes).
    If it's important for your app (or from performance perspective) to run
    a specific function only once, register it here instead of executing it
    in the __init__.py file.
    """

    def __init__(self):
        self._init_funcs = {}
        self._run = False

    def register(self, app_name, f):
        """
        Register a function to be run when the site initializes.

        @param app_name: the name of the application.
        @type app_name: string.
        @param f: executable object.
        """

        if self._run:
            raise "register() can't be called after run()"

        if self._init_funcs.has_key(app_name):
            raise app_name + " already has an init func"

        self._init_funcs[app_name] = f

    def run(self):
        """
        Run all of the registered functions.
        """

        self._run = True

        for app_name, f in self._init_funcs.iteritems():
            try:
                f()
            except:
                logger.critical(app_name + ' server side failed to initialize with the exception:')
                logger.critical(traceback.format_exc())
init = _Init()


def load_applications():
    """
    Load all of the applications server side code.
    This is done by importing all of the packages inside
    the applications directory.
    Note: code which is registered using init.register()
    isn't executed yet.
    """

    path = os.path.dirname(__file__)
    for module in os.listdir(path):
        if module.startswith('_') or not os.path.isdir(os.sep.join([path, module])):
            continue

        try:
            importlib.import_module('.' + module, 'parasite.applications')
        except:
            logger.critical(module + ' server side failed to initialize with the exception:')
            logger.critical(traceback.format_exc())

load_applications()