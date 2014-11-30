#!/usr/bin/python2.7

'''
Created on Nov 11, 2013

@author: yoel
'''

if __name__ != "__main__":
    import os
    os.environ = {}

import sys
sys.path.insert(0, "/".join(__file__.split("/")[:-1]))

from parasite import app as application

if __name__ == "__main__":
    import init_site
    application.run(host = "0.0.0.0", threaded = True, debug = True, use_reloader = False, use_debugger = False, port = 8000)