const combineURL = (config: any) => {
  let url = (config.url || '').trim();
  let baseUrl = (config.baseURL || '').trim();
  if (!url && !baseUrl) url = location.href;
  if (url.indexOf('http') !== 0) {
    const isAbsolute = /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    if (!baseUrl) {
      const arr = location.pathname.split('/');
      arr.pop();
      // tslint:disable-next-line:prefer-template
      baseUrl = location.protocol + '//' + location.host + (isAbsolute ? baseUrl : arr.join('/'));
    }
    // tslint:disable-next-line:prefer-template
    url = baseUrl.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');
    if (typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      url = a.href;
    }
  }
  return url;
};

export function ajax(url: string, options: {
  methods: string;
  responseType: XMLHttpRequestResponseType;
}): any {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = options.responseType || 'json';

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(xhr.statusText));
      }
    };

    const uri = combineURL({
      url,
    });

    xhr.open(options.methods, uri, true);
    xhr.send();
  });
}
