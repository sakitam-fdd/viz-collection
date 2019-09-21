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

    xhr.open(options.methods, url, true);
    xhr.send();
  });
}
