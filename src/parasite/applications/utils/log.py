import logging

handler = logging.StreamHandler()
formatter = logging.Formatter("[%(asctime)s][%(levelname)-7s]%(name)-10s : %(message)s")
handler.setFormatter(formatter)

logger = logging.getLogger("parasite")
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)


def get_logger(app_name):
    """
    @param app_name: the name of the application which
                     will be using the returned logger.
    @return: a logger which should be used in order to log
             activity done by your application.
    """
    return logger.getChild(app_name)