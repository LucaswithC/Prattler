function renameFile(originalFile, newName) {
    return new File([originalFile], newName, {
      type: originalFile.type,
      lastModified: originalFile.lastModified,
    });
  }

  const getHeightAndWidthFromDataUrl = (dataURL) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          height: img.height,
          width: img.width,
        });
      };
      img.src = dataURL;
    });

  function calculateAspectRatioFit(srcWidth, srcHeight, max) {
    var ratio = Math.max(max / srcWidth, max / srcHeight);
    return { width: srcWidth * ratio, height: srcHeight * ratio };
  }

export {renameFile, getHeightAndWidthFromDataUrl, calculateAspectRatioFit}