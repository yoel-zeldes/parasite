'''
Created on Nov 11, 2013

@author: yoel
'''

from flask import request
from flask import jsonify, send_file
from parasite import app
from search import SearchRepository, get_search_query


@app.after_request
def disable_caching(response):
    #TODO: delete the "or True":
    if response.mimetype == "application/json" or True:
        response.headers["Cache-Control"] = "public, max-age=0"#"no-cache, no-store"
        response.headers["Pragma"] = "no-cache"
    
    return response


########################################################################
################################# VIEWS ################################
########################################################################

@app.route('/')
@app.route('/<path:resource_name>')
@app.route('/app/')
@app.route('/app/<path:resource_name>')
def show_home(resource_name = None):
    return send_file("www/build/index.html")


@app.route('/<app_name>/search_options', methods=["GET"])
def search_options(app_name):
    search = SearchRepository.get(app_name)
    if search is None:
        return ""

    q = request.args.get("q", "")
    selected = get_search_query("selected")

    return jsonify({"options" : [{"id" : id, "text" : text}
                                 for id, text in search.get(q, selected)]})