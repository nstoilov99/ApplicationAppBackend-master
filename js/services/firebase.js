let fb = (() => {
        function uploadToFirebase(category, files, title, description, freeImages) {
            let storageRef = firebase.storage().ref();
            console.log('Images are: ');
            console.log(files);
            if (category === '') {
                alert("category can't be blank");
                return;
            }
            
            // Create a root reference
            firebase.auth().signInWithEmailAndPassword("rangelstoilov@gmail.com", "Ab123456").catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                alert(errorMessage);
                // ...
            });

            getCurrentId(function (id) {
                console.log("ID GOT: " + id);
                addCategory(id, category, title, description, freeImages);
                uploadFiles(files, id, storageRef);
            });
        }

function uploadImages(category, files) {
    var storageRef = firebase.storage().ref();

    if (files.length === 0) {
        alert("please select files");
        return;
    }
    // Create a root reference
    firebase.auth().signInWithEmailAndPassword("rangelstoilov@gmail.com", "Ab123456").catch(function (error) {
        // Handle Errors here.
        var errorMessage = error.message;
        alert(errorMessage);
        // ...
    });

        uploadFiles(files, category, storageRef);

}

        function guid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        }

        async function uploadFiles(files, categoryId, storageRef) {
            let x = 0;

            let loopArray = function (arr) {
                editAndUploadFile(arr[x], categoryId, storageRef, function () {
                    // set x to next item
                    x++;
                    if (x == arr.length) {
                        location.reload()
                    }
                    // any more items in array? continue loop
                    if (x < arr.length) {

                        loopArray(arr);
                    }
                });
            };

            loopArray(files);
        }


        function editAndUploadFile(file, categoryId, storageRef, callback) {
            getImageCurrentId(categoryId, function (imageId) {
                // Create the file metadata
                var metadata = {
                    contentType: 'image/png'
                };
                // Upload file and metadata to the object 'images/mountains.jpg'
                var uniqueId = guid();
                var uploadTask = storageRef.child('images/' + uniqueId).put(file, metadata);

                // Listen for state changes, errors, and completion of the upload.
                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                    function (snapshot) {
                        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                        switch (snapshot.state) {
                            case firebase.storage.TaskState.PAUSED: // or 'paused'
                                console.log('Upload is paused');
                                break;
                            case firebase.storage.TaskState.RUNNING: // or 'running'
                                console.log('Upload is running');
                                break;
                        }
                    }, function (error) {

                        // A full list of error codes is available at
                        // https://firebase.google.com/docs/storage/web/handle-errors
                        switch (error.code) {
                            case 'storage/unauthorized':
                                // User doesn't have permission to access the object
                                alert(error.message);
                                break;
                            case 'storage/canceled':
                                // User canceled the upload
                                alert(error.message);
                                break;
                            case 'storage/unknown':
                                // Unknown error occurred, inspect error.serverResponse
                                alert(error.message);
                                break;
                        }
                    }, function () {
                        // Upload completed successfully, now we can get the download URL
                        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                            console.log('File available at', downloadURL);
                            writeImagesToCategory(categoryId, imageId, downloadURL, uniqueId);
                            callback();
                        });
                    });
            });
        }


        function writeImagesToCategory(categoryId, imageId, downloadURL, storageRef) {
            firebase.database().ref('categories/' + categoryId + '/images/' + imageId).update({
                transparencyTolerance: "90",
                big: downloadURL,
                storageReference: storageRef
            });
        }

        function getCurrentId(callback) {
            firebase.database().ref('categories/').orderByKey().limitToLast(1).once("value", function (snapshot) {
                console.log(snapshot.numChildren());
                if (snapshot.numChildren() > 0) {
                    snapshot.forEach(async function (child) {
                        await callback(parseInt(child.key) + 1);
                    });
                } else {
                    callback(0);
                }
            })
        }

        function getImageCurrentId(category, callback) {
            console.log("THIS IS CAT: " + category);
            firebase.database().ref('categories/' + category + '/images').orderByKey().limitToLast(1).once("value", function (snapshot) {
                console.log(snapshot.numChildren());
                if (snapshot.numChildren() > 0) {
                    snapshot.forEach(function (child) {
                        console.log(parseInt(child.key));
                        callback(parseInt(child.key) + 1);
                    });
                } else {
                    callback(0);
                }
            })
        }


        function addCategory(id, category, title, description, freeImages) {
            firebase.database().ref('categories/' + id).update({
                title: category,
                product: {
                    title: title,
                    id: id,
                    description: description,
                    freeImages: freeImages
                }
            });
        }

        return {
            uploadToFirebase,
            uploadImages
        }
    }

)();
