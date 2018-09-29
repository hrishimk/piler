import * as dm from 'xmldom';

let error_handler: dm.ErrorHandlerObject = {
    warning: (msg: any) => { },
    error: (msg: any) => { /*console.log(msg)*/ },
    fatalError: (msg: any) => { console.log(msg) }
}

export function transform(content: string): string {
    let a: dm.Options;
    let parser = new dm.DOMParser({ errorHandler: error_handler });
    let serializer = new dm.XMLSerializer();
    let parsed = parser.parseFromString(content, "text/html");
    if (!parsed) {
        //console.log('error');
        return content;
    }
    //console.log('success');
    //let document = parsed.documentElement;
    //console.log(parsed);
    let charset_node = get_charset_node(parsed);

    if (!charset_node) {
        charset_node = parsed.createElement('meta');
        get_head(parsed).appendChild(charset_node);
    }
    //@ts-ignore
    charset_node.setAttribute('charset', 'UTF-8');

    return serializer.serializeToString(parsed);
}

function get_charset_node(doc: Document): Node | void {
    let elems = doc.getElementsByTagName('meta');
    for (var i = 0, q = elems.length; i < q; i++) {
        if (elems[i].hasAttribute('charset')) {
            return elems[i];
        }
    }
}

function get_head(doc: Document) {
    let head = doc.getElementsByTagName('head')[0];
    if (!head) {
        head = doc.createElement('head');
        doc.insertBefore(head, doc.firstChild);
    }
    return head;
}
