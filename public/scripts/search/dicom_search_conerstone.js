

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWebImageLoader.external.cornerstone = cornerstone;
cornerstone.imageCache.setMaximumSizeBytes(100*1024*1024);

/*cornerstoneWADOImageLoader.configure({
    beforeSend: function(xhr) {
        // Add custom headers here (e.g. auth tokens)
        //xhr.setRequestHeader('APIKEY', 'my auth token');
    }
});*/

function loadAndViewImage(element , imageId) {
    
    try {
        cornerstone.loadAndCacheImage(imageId).then(function(image) {
            let viewport = cornerstone.getDefaultViewportForImage(element, image);
            cornerstone.displayImage(element, image, viewport);
            image = null;
            viewport = null;
            element = null;
        });
    }
    catch (e) {
        console.log(e);
    }
}

function loadAndViewImageWeb(element , imageId) {
    
    try {
        cornerstone.loadImage(imageId).then(function(image) {
            let viewport = cornerstone.getDefaultViewportForImage(element, image);
            cornerstone.displayImage(element, image, viewport);
            image = null;
            viewport = null;
            element = null;
        });
    }
    catch (e) {
        console.log(e);
    }
}
