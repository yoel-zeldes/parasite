# Parasite - general purpose web applications framework

Parasite is a framework for creating web applications.

Parasite is meant to be used to create SPA (single page application) sites conforming to a certain functional template.

This template is explorer-like: if your site contains navigation portion and content viewing portion (the same as windows explorer for example) - this framework is for you.

It provides a plugins infrastructure: you can assemble different navigation plugins - which give the user the ability to navigate through your SPA, with different content plugins - which give the user the ability to watch the content of your SPA.

Parasite will do the rest for you - it'll manage the state of your SPA, do the linking between the available navigation plugins and content plugins, help you with the visualizations, and more. In short - it'll make your life easier.

**Note**: feel free to contribute to the Parasite framework - either by implementing additional navigation/content plugins, or by extending the framework itself.

**Another note**: parasite web applications are best viewd using chrome.

## Getting started

- Run git clone https://github.com/yoel-zeldes/parasite.git
- Make sure node.js is installed.
- Make sure python is installed (needed for running the server side).
- Download and install [flask](http://pypi.python.org/packages/source/F/Flask/Flask-0.10.1.tar.gz) for python.
- Run npm install
- Run bower install
- Run the server side using cd src; python parasite.wdgi, or just run it using your favorite IDE.
- Run the parasite script for starting developing (parasite dev) or for production (parasite prod).
- If in development mode, go to the [devcenter](http://127.0.0.1:8000/app/devcenter) at to learn more.

Parasite is free software/open source, and is distributed under the [MIT](http://opensource.org/licenses/MIT).
