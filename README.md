# h5-fileuploader
A javascript file uploader based on html5

# Usage

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Demo</title>
    <script src="index.js"></script>
</head>
<body>
    <input type="file" id="myfile">
</body>
</html>
```

```javascript
var up = new FileUploader('myfile', {
    // 服务端接收文件的名称
    fieldName: 'file'
    // 是否自动上传
    ,auto: false
    // 是否多选
    ,multiple: true
    // 接收的文件类型
    ,accept: 'image/jpg, image/jpeg, image/png, image/gif'
    // 文件大小限制
    ,fileSizeLimit: 102410245  // 5Mb
});

// upload server
up.configs.server = '/api/upload';

/**
 * other post params
 */
up.configs.postParams = {
    token: 'xxx',
    otherinfo: 'xxx'
};

/**
 * headers info
 */
up.configs.headers = {
    'csrf': 'xxx'
};

/**
 * called on a file added to queue
 */
up.fileQueuedHandler = function(file) {
     console.log('one file queued: ', file);
}

/**
 * called on all selected files queued
 */
up.filesQueuedCompleteHandler = function(obj) {
     // 非自动上传模式下，可以在这里调用上传方法手动上传
     console.log('all files queued: ', obj);
     
     // up.startUpload();
}

/**
 * upload progress
 */
up.uploadProgressHandler = function(file, percent) {
     console.log(percent);
}

/**
 * called on a file upload success
 */
up.uploadSuccessHandler = function(file, serverData) {
     // serverData 为服务器返回的数据
     console.log(serverData);
}

/**
 * called on all files upload success or fail
 */
up.uploadCompleteHandler = function() {
     console.log('upload complete');
}
```

# Support

Theoretically supports all html5 browsers.

+ IE 10+

+ Chrome

+ Firefox

+ Safari