/**
 * This is my own version of pjax, written as a short version of the pjax libraries
 * in order to understand how it works
 */
window.pjax = {};

pjax.container = '.body';
pjax.funQueue = {};

pjax.setup = function(){
    var self = this;

    if (history && history.pushState) {
        var pjaxLinks = document.querySelectorAll('.pjax-link');
        pjaxLinks.forEach(function(pjaxLink){
            pjaxLink.addEventListener('click', function(e){
                if(e.target.tagName.toLowerCase() === 'a'){
                    e.preventDefault();
                    self.request(e.target.href);
                    history.pushState(null, null, e.target.href);
                }
            });
        });

        window.onpopstate = function() {
            self.request(window.location.href);
        };
    }

    return this;
};

pjax.request = function(url) {
    var self = this;

    var xhr = new XMLHttpRequest();

    xhr.open('GET', url);
    xhr.responseType = 'document';
    
    xhr.addEventListener('load', function(e){
        var attrs = [
            {
                selector: 'meta[name$="description"]',
                attribute: 'content'
            }
        ];
        var selectors = [
            'title',
            '.header-title h1'
        ];
        
        for(var i = 0, len = selectors.length; i < len; i++){
            var els = document.querySelectorAll(selectors[i]);
            els.forEach(function(el, key){
                el.textContent = this.response.querySelectorAll(selectors[i])[key].textContent;
            });
        }

        for(var i = 0, len = attrs.length; i < len; i++){
            var els = document.querySelectorAll(attrs[i].selector);
            els.forEach(function(el, key){
                el.setAttribute(
                    attrs[i].attribute,
                    this.response.querySelectorAll(attrs[i].selector)[key].getAttribute(attrs[i].attribute)
                );
            });
        }

        var scripts = this.response.querySelectorAll(self.container + ' script');
        
        var newPage = this.response.querySelector(self.container);
        var currentPage = document.querySelector(self.container);
        currentPage.parentNode.replaceChild(newPage, currentPage);

        scripts.forEach(function(code){
            var script = document.createElement('script');
            script.text = code.textContent;
            document.head.appendChild(script).parentNode.removeChild(script);
        });
        
        if(typeof self.afterLoad === 'function'){
            self.afterLoad();
        }
    });

    xhr.send();

    return this;
};

pjax.execQueue = function(){
    var queue = pjax.funQueue;
    
    for(var funcName in queue){
        if(queue.hasOwnProperty(funcName)){
            if(typeof queue[funcName] === 'function'){
                try {
                    queue[funcName]();
                } catch(e) {
                    console.log(e);
                }
            }
        }
    }
    
    return this;
};

pjax.onload = function(callback, func){
    if(typeof callback === 'function'){
        pjax.funQueue[Object.keys(pjax.funQueue).length.toString()] = callback;
    }

    if((typeof callback === 'number' || typeof callback === 'string') && typeof func === 'function'){
        pjax.funQueue[callback] = func;
    }
    
    window.onload = this.execQueue;
    this.afterLoad = this.execQueue;
    
    return this;
};
