'use strict';
define([], function() {
    function addCSS(url) {
        var head = document.querySelector('head');
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', url);
        head.appendChild(link);
    }

    return {
        boot: function(el, context, config, mediator) {
            if(el.clientWidth >= 620) {
                addCSS('<%= assetPath %>/main.css');

                // Loading message while we fetch JS / CSS
                el.innerHTML = '';

                config = {
                    'assetPath': '<%= assetPath %>'
                };

                // Load JS and init
                require(['<%= assetPath %>/main.js'], function(main) {
                    main.init(el, context, config, mediator);
                }, function(err) { console.error('Error loading boot.', err); });
            } else {
                var iframeUrl = "";
                if(el.getAttribute("data-alt") === "mdg") {
                  iframeUrl = "https://interactive.guim.co.uk/uploader/embed/2016/09/archive-4-zip/giv-310753W7Nyc9H4tkL/";
                } else {
                  iframeUrl = "https://interactive.guim.co.uk/uploader/embed/2016/09/archive-2-zip/giv-31075XwB0iPRQxb5c/";
                }

                el.innerHTML = '<iframe height="1064" src="' + iframeUrl + '" style="width: 100%; border: none;"></iframe></figure>';

                window.addEventListener('message', function(event) {
                    var iframe = el.querySelector("iframe");

                    if (event.source !== iframe.contentWindow) {
                        return;
                    }

                    // IE 8 + 9 only support strings
                    var message = JSON.parse(event.data);

                    // Actions
                    switch (message.type) {
                        case 'set-height':
                            iframe.height = message.value;
                            break;
                        case 'navigate':
                            document.location.href = message.value;
                            break;
                        case 'scroll-to':
                            window.scrollTo(message.x, message.y);
                            break;
                        case 'get-location':
                            _postMessage({
                                'id':       message.id,
                                'type':     message.type,
                                'hash':     window.location.hash,
                                'host':     window.location.host,
                                'hostname': window.location.hostname,
                                'href':     window.location.href,
                                'origin':   window.location.origin,
                                'pathname': window.location.pathname,
                                'port':     window.location.port,
                                'protocol': window.location.protocol,
                                'search':   window.location.search
                            }, message.id);
                            break;
                        case 'get-position':
                            _postMessage({
                                'id':           message.id,
                                'type':         message.type,
                                'iframeTop':    iframe.getBoundingClientRect().top,
                                'innerHeight':  window.innerHeight,
                                'innerWidth':   window.innerWidth,
                                'pageYOffset':  window.pageYOffset
                            });
                            break;
                        default:
                           console.error('Received unknown action from iframe: ', message);
                    }
                }, false);

            }
        }
    };
});
