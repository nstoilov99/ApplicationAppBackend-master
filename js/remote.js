let remote = (() => {
        function uploadToFirebase() {
            let storageRef = firebase.storage().ref();
            let category = $('#category').val();
            let files = $('#images')[0].files;
            let title = $('#title').val();
            let description = $('#description').val();
            let freeImages = $('#freeImages').val();
            let currentID = 0;
            if (category === '') {
                alert("category can't be blank");
                return;
            }
            if (files.length === 0) {
                alert("please select files");
                return;
            }
            // Create a root reference
            firebase.auth().signInWithEmailAndPassword("rangelstoilov@gmail.com", "Ab123456").catch(function (error) {
                // Handle Errors here.
                let errorCode = error.code;
                let errorMessage = error.message;
                alert(errorMessage);
                // ...
            });

            getCurrentId(function (id) {
                console.log("ID GOT: " + id);
                addCategory(id, category, title, description, freeImages);
                uploadFiles(files, id, storageRef)
            });
        }

        function uploadFiles(files, categoryId, storageRef) {
            let x = 0;
            let loopArray = function (arr) {
                editAndUploadFile(arr[x], categoryId, storageRef, function () {
                    // set x to next item
                    x++;

                    // any more items in array? continue loop
                    if (x < arr.length) {
                        loopArray(arr);
                    }
                });
            }

            loopArray(files);

            //
            // Array.from(files).forEach(file => {
            //     console.log("Array time" + i);
            //     i++;
            //     //Convert Image to thumb
            //     //Get common ID for image
            //
            //     });
        }


        function changeCategoryOrder(oldId, newId) {
            let categoryRef = firebase.database().ref('categories');

            categoryRef.child(oldId).once('value').then(async function (snap) {
                console.log('New Id:' + newId);
                console.log('Snapshot id: ' + oldId);
                let snapshot = await snap.val();

                if (oldId < newId) {
                    for (let i = oldId; i < newId; i++) {
                        let nextItemId = i + 1;
                        let snap = await categoryRef.child(nextItemId).once('value');
                        let data = snap.val();
                        console.log('Next item id and data: ' + nextItemId);
                        console.log(data);
                        console.log('Current item id: ' + i);
                        console.log('Next item updated!');
                        await categoryRef.child(i).update(data);
                    }
                } else {
                    for (let i = oldId; i > newId; i--) {
                        console.log(i - 1);
                        let snap = await categoryRef.child(i - 1).once('value');
                        let data = snap.val();
                        console.log("Here: " + i);
                        await categoryRef.child(i).update(data);
                    }
                }
                return snapshot;
            }).then(function (snapshot) {
                console.log("SNAPSHOT UPDATED NENENENENEN !");
                categoryRef.child(newId).update(snapshot);
            });

        }

        function changeImageOrder(cat, oldId, newId) {
            console.log("We are here: " + cat);
            let imageRef = firebase.database().ref('categories/' + cat + '/images');
            console.log(imageRef);
            imageRef.child(oldId).once('value').then(async function (snap) {
                let snapshot = await snap.val();

                console.log("new: " + snapshot);
                if (oldId < newId) {
                    for (let i = oldId; i < newId; i++) {
                        console.log(i);
                        imageRef.child(i + 1).once('value').then(async function (snap) {
                            let data = await snap.val();
                            console.log("Here: " + i);
                            console.log(imageRef.child(i - 1));
                            await imageRef.child(i).update(data);
                        });
                    }
                } else {
                    for (let i = oldId; i > newId; i--) {
                        console.log(i - 1);
                        imageRef.child(i - 1).once('value').then(async function (snap) {
                            let data = await snap.val();
                            console.log("Here: " + i);
                            console.log(imageRef.child(i + 1));
                            await imageRef.child(i).update(data);
                        });
                    }
                }
                return snapshot;
            }).then(async function (snapshot) {
                imageRef.child(newId).update(snapshot);
            });

        }

        async function deleteCategory(categoryId) {
            console.log(categoryId);
            let categoryRef = firebase.database().ref('categories/');
            let snapNumberImages = await  firebase.database().ref('categories/' + categoryId + '/images').once('value');
            let snapNumberCategories = await  firebase.database().ref('categories/').once('value');
            let numberImages =await snapNumberImages.numChildren();
            let numberCategories =await snapNumberCategories.numChildren();
            console.log('Number of images: ' + numberImages);
            console.log('Number of categories: ' + numberCategories);
            for (let i = 0; i < numberImages; i++) {
                let snapImageStorageRef =await firebase.database().ref('categories/' + categoryId + '/images').child(i).child('storageReference').once('value');
                let imageStorageRef = snapImageStorageRef.val();
                console.log('Storage reference: ' + imageStorageRef);
                // await firebase.database().ref('categories/' + categoryId + '/images').child(i).remove();
                await firebase.storage().ref('images/').child(imageStorageRef).delete();
            }
            for (let i = parseInt(categoryId)+1; i <numberCategories ; i++) {
                console.log(i);
                let nextValueSnap = await categoryRef.child(i).once('value');
                let data = await nextValueSnap.val();
                console.log(data);
                await  categoryRef.child(i-1).update(data);
            }
            await firebase.database().ref('categories/').child(numberCategories - 1).remove();
        }

        async function deleteImageFromCategory(imageId, category) {
            let imagesRef = await firebase.database().ref('categories/' + category);
            let snapImg = await imagesRef.child('/images').once('value');
            let storageSnap = await  imagesRef.child('/images').child(imageId).child('storageReference').once('value');
            let storage = await storageSnap.val();

            let imageNumber = await snapImg.numChildren();
            console.log('Image number: ' + imageNumber);
            for (let i = parseInt(imageId)+1; i < imageNumber; i++) {
                console.log('Image Id update: ' + i);
                let nextValueSnap = await imagesRef.child('/images').child(i).once('value');
                let data = await nextValueSnap.val();
                console.log('Snap data:');
                console.log(data);
                console.log('Image i update: ' + i);
                await   imagesRef.child('/images').child(i-1).update(data);
            }
            await firebase.database().ref('categories/' + category + '/images').child(imageNumber-1).remove();
            await firebase.storage().ref('images/').child(storage).delete();

        }

        function getAllCategories(callback) {
            firebase.database().ref('categories/').once("value", function (snapshot) {
                console.log(snapshot.val());
                callback(snapshot.val())
            })
        }

        function getCategoryById(id, callback) {
            console.log(id);
            firebase.database().ref('categories/' + id).on("value", function (snapshot) {
                console.log(snapshot.val());
                callback(snapshot.val())
            })
        }

        function editAndUploadFile(file, categoryId, storageRef, callback) {
            getImageCurrentId(categoryId, function (imageId) {
                // Create the file metadata

                var metadata = {
                    contentType: 'image/png'
                };
                // Upload file and metadata to the object 'images/mountains.jpg'
                var uploadTask = storageRef.child('images/' + file.name).put(file, metadata);

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
                            writeImagesToCategory(categoryId, imageId, downloadURL);
                            callback();
                        });
                    });
            });
        }


        function writeImagesToCategory(categoryId, imageId, downloadURL) {
            firebase.database().ref('categories/' + categoryId + '/images/' + imageId).update({
                transparencyTolerance: "90",
                big: downloadURL
            });
        }

        function getCurrentId(callback) {
            firebase.database().ref('categories/').orderByKey().limitToLast(1).once("value", function (snapshot) {
                console.log(snapshot.numChildren());
                if (snapshot.numChildren() > 0) {
                    snapshot.forEach(function (child) {
                        callback(parseInt(child.key) + 1);
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
            getAllCategories,
            changeCategoryOrder,
            getCategoryById,
            changeImageOrder,
            deleteImageFromCategory,
            deleteCategory
        }
    }

)();