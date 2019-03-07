/**
 * FileUploader
 *
 * @version 0.1.0
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.FileUploader = factory());
}(this, function () { 'use strict';

    /**
     * html5 file upload
     *
     * support multiple file upload
     *
     * maybe need IE10+
     *
     * @author afu
     *
     * eg.
     *
     * var up = new FileUploader('elementId', {
     *      server: 'http://localhost/upload.php',
     *      fieldName: 'file'
     * });
     *
     * up.fileQueuedHandler = function(file) {
     *      // 一个文件加入队列后触发
     *      // 可以在这里渲染上传进度页面
     * }
     *
     * up.filesQueuedCompleteHandler = function(obj) {
     *      // 所有文件加入队列后触发
     *      // 可以在这里调用上传方法开始上传
     * }
     *
     * up.uploadProgressHandler = function(file, percent) {
     *      // 上传进度回调
     *      // 可以在这里处理进度条
     * }
     *
     * up.uploadSuccessHandler = function(file, serverData) {
     *      // 一个文件上传完成触发
     *      // serverData 为服务器返回的数据
     *      // 可以在这里对服务器返回的数据进行处理
     * }
     *
     * up.uploadCompleteHandler = function() {
     *      // 队列中所有文件上传完成触发
     * }
     *
     * up.startUpload();
     *
     */
    function FileUploader(id, options) {
        this.doc = document;
        this.fileInput = null;
        this.id = id;

        this.xhr = new XMLHttpRequest();

        // 文件队列
        this.filesQueue = null;

        // 一个文件加入队列后事件
        this.fileQueuedHandler = null;
        // 文件加入队列时出错
        this.fileQueuedErrorHandler = null;
        // 所有文件入队完成
        this.filesQueuedCompleteHandler = null;
        // 开始上传前
        this.uploadStartHandler = null;
        // 上传进度
        this.uploadProgressHandler = null;
        // 一个文件上传完成
        this.uploadSuccessHandler = null;
        // 队列文件全部上传完毕
        this.uploadCompleteHandler = null;

        this.configs = {
            postParams: {}
            ,headers: {}
            ,server: ''
            ,fieldName: 'xeditorfile'
            ,useFormData: true
            ,withCredentials: false

            ,auto: false
            ,multiple: true
            ,accept: 'image/jpg, image/jpeg, image/png, image/gif'
            ,fileSizeLimit: 1024 * 1024 * 5  // 5Mb
        };

        this.init(options);
    }FileUploader.prototype = {
        constructor: FileUploader,
        extend: function(origin, configs) {
            if(undefined === configs) {
                return origin;
            }

            for(var k in configs) {
                origin[k] = configs[k];
            }

            return origin;
        },
        fireEvent: function(eventName, data, message) {
            var handler = eventName + 'Handler';

            if(null === this[handler]) {
                return;
            }

            this[handler](data, message);
        },
        setupXHR: function(file) {
            var _self = this;

            this.xhr.upload.onprogress = function(e) {
                var percent = 0;
                if(e.lengthComputable) {
                    percent = e.loaded / e.total;
                }

                _self.fireEvent('uploadProgress', file, percent);
            };

            this.xhr.onreadystatechange = function() {
                if(4 !== _self.xhr.readyState) {
                    return;
                }

                _self.xhr.upload.onprogress = null;
                _self.xhr.onreadystatechange = null;

                if(200 === _self.xhr.status) {
                    _self.fireEvent('uploadSuccess', file, _self.xhr.responseText);
                }

                // 上传下一个
                _self.startUpload();
            };

            this.xhr.open('POST', this.configs.server, true);

            if(this.configs.withCredentials) {
                this.xhr.withCredentials = true;
            }

            // headers
            for(var k in this.configs.headers) {
                this.xhr.setRequestHeader(k, this.configs.headers[k]);
            }
        },
        init: function(options) {
            var _self = this;

            if(undefined !== options) {
                this.extend(this.configs, options);
            }

            this.fileInput = this.doc.getElementById(this.id);
            this.fileInput.setAttribute('accept', this.configs.accept);
            if(this.configs.multiple) {
                this.fileInput.setAttribute('multiple', 'multiple');
            }

            this.fileInput.onchange = function(e) {
                _self.selectFiles();
            };

            // 自动上传
            this.filesQueuedCompleteHandler = function(obj) {
                if(_self.configs.auto) {
                    _self.startUpload();
                }
            };
        },
        isValidFile: function(file) {
            if(file.size > this.configs.fileSizeLimit) {
                return false;
            }

            if(-1 === this.configs.accept.indexOf(file.extension)) {
                return false;
            }

            return true;
        },
        selectFiles: function() {
            var fileList = this.fileInput.files;
            if(fileList.length <= 0) {
                return;
            }

            this.filesQueue = new FileUploader.Queue();

            var i = 0;
            var len = fileList.length;
            var tmpFile = null;
            for(; i<len; i++) {
                tmpFile = new FileUploader.File(fileList[i]);

                // 检查规则
                if(!this.isValidFile(tmpFile)) {
                    this.fireEvent('fileQueuedError', tmpFile, 'The selected file is invalid');

                    continue;
                }

                this.filesQueue.add(tmpFile);

                this.fireEvent('fileQueued', tmpFile);
            }

            this.fireEvent('filesQueuedComplete', {
                selected: len,
                queued: this.filesQueue.size
            });
        },
        uploadAsFormData: function(file) {
            var fd = new FormData();

            for(var k in this.configs.postParams) {
                fd.append(k, this.configs.postParams[k]);
            }

            fd.append(this.configs.fieldName, file.nativeFile);

            this.setupXHR(file);

            this.xhr.send(fd);
        },
        uploadAsBinary: function(file) {
            var _self = this;
            var fr = new FileReader();

            fr.onload = function(e) {
                _self.xhr.send(this.result);

                fr = fr.onload = null;
            };

            this.setupXHR(file);
            this.xhr.overrideMimeType('application/octet-stream');

            fr.readAsArrayBuffer(file.nativeFile);
        },
        /**
         * 替换请求参数
         *
         * @param {Object} paramsObject
         */
        replacePostParams: function(paramsObject) {
            this.configs.postParams = paramsObject;
        },
        /**
         * 设置请求参数
         *
         * @param {String} name
         * @param {any} value
         */
        setPostParam: function(name, value) {
            this.configs.postParams[name] = value;
        },
        /**
         * 开始上传
         */
        startUpload: function() {
            var file = this.filesQueue.take();

            if(null === file) {
                // 清空 input
                this.fileInput.value = '';

                this.fireEvent('uploadComplete');

                return;
            }

            if(this.configs.useFormData) {
                this.uploadAsFormData(file);

                return;
            }

            this.uploadAsBinary(file);
        }
    };
    FileUploader.Queue = function() {
        this.headNode = null;
        this.tailNode = null;
        this.size = 0;
    };
    FileUploader.Queue.prototype.add = function(data) {
        var node = new FileUploader.QueueNode(data, null);

        if(0 === this.size) {
            this.headNode = node;

        } else {
            this.tailNode.next = node;
        }

        this.tailNode = node;

        this.size++;
    };
    FileUploader.Queue.prototype.take = function() {
        // 为空直接返回
        if(0 === this.size) {
            return null;
        }

        var data = this.headNode.data;
        var tmpHeadNode = this.headNode;

        // 从队列去除头节点
        this.headNode = tmpHeadNode.next;
        tmpHeadNode.next = null;
        tmpHeadNode = null;

        // 没节点了
        if(null === this.headNode) {
            this.headNode = this.tailNode = null;
        }

        this.size--;

        return data;
    };
    FileUploader.Queue.prototype.clear = function() {
        while(0 !== this.size) {
            this.take();
        }
    };
    FileUploader.Queue.prototype.toArray = function() {
        var ret = new Array(this.size);

        var i = 0;
        var current = null;
        for(current = this.headNode; null !== current; current = current.next) {
            ret[i] = current.data;
            i++;
        }

        return ret;
    },
    FileUploader.QueueNode = function(data, next) {
        this.data = data;
        this.next = next;
    };
    FileUploader.File = function(file) {
        this.nativeFile = file;

        this.id = 'xef' + FileUploader.File.uuid++;
        /**
         * The name of the file referenced by the File object
         */
        this.name = file.name;
        /**
         * The size of the file in bytes
         */
        this.size = file.size;
        /**
         * A string, containing the media type. eg. "image/png"
         */
        this.type = file.type;
        /**
         * A string, file type extension. eg. "png"
         */
        this.extension = file.type.substring(file.type.indexOf('/') + 1);
        /**
         * The last modified time of the file
         */
        this.lastModified = file.lastModified;
    };
    FileUploader.File.uuid = 0;

    return FileUploader;

}));
