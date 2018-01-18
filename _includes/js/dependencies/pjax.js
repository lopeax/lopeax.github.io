/**
 * This is an ES6 Class that handles PJAX logic for an application
 *
 * It utilizes pushstate and history in order to help make a site load only a
 * portion of the page, thereby lowering the amount of requests on the page and
 * as a result speeds up user experience for a live demo, view
 * https://zeraphie.github.io/
 *
 * @license MIT
 * @version 1.1.0
 * @author Izzy Skye
 */
class PJAX {
    /**
     * Construct the PJAX class and add the default container if none is passed
     * through as well as an empty function queue
     *
     * @param container
     * @param links
     * @param replace
     */
    constructor(
        container = this.constructor.DEFAULT_CONTAINER,
        links = this.constructor.DEFAULT_LINKS,
        replace = this.constructor.DEFAULT_REPLACE
    ){
        this.container = container;
        this.links = links;
        this.replace = replace;
        this.queue = [];
    }
    
    /**
     * The default selector for PJAX to replace
     * 
     * @returns {string} DEFAULT_CONTAINER The default container
     * @constructor
     */
    static get DEFAULT_CONTAINER(){
        return '.body';
    }
    
    /**
     * The default selector for PJAX to execute pjax from
     * 
     * @returns {string} DEFAULT_CONTAINER The default links
     * @constructor
     */
    static get DEFAULT_LINKS(){
        return '.pjax-link';
    }
    
    /**
     * The default elements to replace the content/attribute
     * 
     * @returns {{textContent: string[], attribute: *[]}} DEFAULT_REPLACE The default replace
     * @constructor
     */
    static get DEFAULT_REPLACE(){
        return {
            textContent: [
                'title'
            ],
            attribute: [
                {
                    selector: 'meta[name$="title"]',
                    attribute: 'content'
                },
                {
                    selector: 'meta[name$="description"]',
                    attribute: 'content'
                },
                {
                    selector: 'meta[property^="og:"]',
                    attribute: 'content'
                },
                {
                    selector: 'meta[property^="article:"]',
                    attribute: 'content'
                },
                {
                    selector: 'link[rel="canonical"]',
                    attribute: 'href'
                }
            ]
        }
    }
    
    /**
     * Add all the event listeners needed for an application to use pjax, these
     * are typically just links and forms, although forms are to come
     * 
     * @returns {PJAX}
     */
    setup(){
        if(history && history.pushState){
            this.addLinkEvent(document.querySelectorAll(this.links));
            
            window.onpopstate = () => {
                this.request(window.location.href);
            };
            
            /* Make sure the onload functions are fired at least once! */
            this.execQueue();
        }
        
        return this;
    }
    
    /**
     * Add the pjax link event to all the links passed into this function
     * 
     * @param pjaxLinks A node list of all the links to pjax
     * @returns {PJAX}
     */
    addLinkEvent(pjaxLinks){
        pjaxLinks.forEach(pjaxLink => {
            pjaxLink.addEventListener('click', e => {
                e.preventDefault();
                this.request(e.target.href);
                history.pushState(null, null, e.target.href);
            });
        });
        
        return this;
    };
    
    /**
     * Make the actual pjax request, replacing the title and description of the
     * page as well as the body and making scripts executable
     * 
     * @param url The url to perform the pjax request to
     * @returns {PJAX}
     */
    request(url){
        /* Open an ajax get request to the url, requesting the document */
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'document';
        
        /* After loading the document, do the replacing */
        xhr.addEventListener('load', e => {
            let response = e.currentTarget.response;
            
            /* Replace all the text content fields */
            for(let i = 0, len = this.replace.textContent.length; i < len; i++){
                let elements = document.querySelectorAll(
                    this.replace.textContent[i]
                );
                
                elements.forEach((element, key) => {
                    let found = response.querySelectorAll(
                        this.replace.textContent[i]
                    );
                    
                    if(found.length && found[key]){
                        element.textContent = found[key].textContent;
                    }
                });
            }
            
            /* Replace all the attributes */
            for(let i = 0, len = this.replace.attribute.length; i < len; i++){
                let elements = document.querySelectorAll(
                    this.replace.attribute[i].selector
                );
                
                elements.forEach((element, key) => {
                    let found = response.querySelectorAll(
                        this.replace.attribute[i].selector
                    );
                    
                    if(found.length && found[key]){
                        element.setAttribute(
                            this.replace.attribute[i].attribute,
                            found[key].getAttribute(
                                this.replace.attribute[i].attribute
                            )
                        );
                    }
                });
            }
            
            /* Add the pjax link event to any new links in the content */
            this.addLinkEvent(response.querySelectorAll(
                `${this.container} ${this.links}`
            ));
            
            /* Replace the actual content of the page */
            let newPage = response.querySelector(this.container);
            
            let currentPage = document.querySelector(this.container);
            currentPage.parentNode.replaceChild(newPage, currentPage);
            
            /* Replace all the script tags and execute them */
            let scripts = response.querySelectorAll(
                `${this.container} script`
            );
            
            scripts.forEach(code => {
                let script = document.createElement('script');
                script.text = code.textContent;
                document.head.appendChild(script).parentNode.removeChild(script);
            });
            
            /* Execute the queue */
            if(typeof this.afterLoad === 'function'){
                this.afterLoad();
            }
        });
        
        /* Actually send the ajax request */
        xhr.send();
        
        return this;
    }
    
    /**
     * Execute the function queue
     * 
     * @returns {PJAX}
     */
    execQueue(){
        this.queue.forEach(func => {
            if(typeof func === 'function'){
                try {
                    func();
                } catch(e) {
                    console.log('Failed to execute: ', e, func);
                }
            }
        });
        
        return this;
    }
    
    /**
     * This function is to be used in place of window.onload as it will fire any
     * javascript when the page is loaded initially and on any subsequent pjax
     * requests
     * 
     * @param callback The callback function
     * @returns {PJAX}
     */
    onload(callback){
        if(typeof callback === 'function'){
            this.queue.push(callback);
        }
        
        window.onload = this.execQueue;
        this.afterLoad = this.execQueue;
        
        return this;
    }
}

window.PJAX = PJAX;
window.pjax = new PJAX();

pjax.replace.textContent.push('h1');
