$(() => {
    const app = Sammy('#app', function () {
        this.use('Handlebars', 'hbs');

        this.get('#/home', getWelcomePage);
        this.get('index.html', getWelcomePage);

        this.get('#deleteImage/:category/:id', (ctx) => {
            let imageId = ctx.params.id;
            let category = ctx.params.category;
            remote.deleteImageFromCategory(imageId, category).then(function () {
                ctx.loadPartials({
                    navigation: './templates/common/navigation.hbs',
                    header: './templates/common/header.hbs',
                    addCategory: './templates/forms/addCategory.hbs',
                    addImages: './templates/forms/addImages.hbs'
                }).then(function () {
                    ctx.redirect(`#category/${category}`);
                })
            });
        });

        this.post('#category/uploadImages', (ctx) => {
            let category = ctx.params.category;
            let images = $('#files')[0].files;
            console.log(images);
            console.log(category);
            fb.uploadImages(category, images)
        });

        this.post('#upload', (ctx) => {
            let category = ctx.params.category;
            console.log(category);
            let title = ctx.params.title;
            let descr = ctx.params.description;
            let images = $('#files')[0].files;
            console.log(ctx.params);
            console.log(images);
            let freeImages = ctx.params.freeImages;
            fb.uploadToFirebase(category, images, title, descr, freeImages);
        });

        this.get('#category/:id', (ctx) => {
            let categoryId = ctx.params.id;
            remote.getCategoryById(categoryId, function (category) {
                ctx.images = category.images;
                ctx.category = categoryId;
                ctx.loadPartials({
                    navigation: './templates/common/navigation.hbs',
                    header: './templates/common/header.hbs',
                    addCategory: './templates/forms/addCategory.hbs',
                    addImages: './templates/forms/addImages.hbs'
                }).then(function () {
                    this.partial('./templates/categoryImages.hbs').then(() => {
                        order.loadSortableImages(categoryId);
                    });
                })
            })
        });
        this.get('#delete/:id', (ctx) => {
            let categoryId = ctx.params.id;

            remote.deleteCategory(categoryId).then(function () {
                ctx.loadPartials({
                    navigation: './templates/common/navigation.hbs',
                    header: './templates/common/header.hbs',
                    addCategory: './templates/forms/addCategory.hbs',
                    addImages: './templates/forms/addImages.hbs'
                }).then(function () {
                    window.history.go(-1);
                })
            });
        });


        function getWelcomePage(ctx) {
            remote.getAllCategories(function (categories) {
                ctx.categories = categories;
                console.log(ctx.categories);

                ctx.loadPartials({
                    navigation: './templates/common/navigation.hbs',
                    header: './templates/common/header.hbs',
                    addCategory: './templates/forms/addCategory.hbs'
                }).then(function () {
                    this.partial('./templates/categories.hbs').then(() => {
                        order.loadSortableCategory();
                    });
                })
            });
        }

    });

    app.run();
});