/*
 * @File: 主入口 
 */
import Developer from './main/developer'
import {data} from './../data/firstYearStory'
// import {data} from './../data/matrix'

let scaleEle = document.getElementById('scale');

let devCanvas = new Developer(
    'dev',
    {
        canvasWidth: 800, //canvas width
        canvasHeight: 600, //canvas height
        data: data //janvas data
    },
    (dev) => {
        //修改为只读模式
        // dev.changeMode(Developer.MODE.READ_MODE);

        //修改为编辑模式
        // dev.changeMode(Developer.MODE.EDIT_MODE);

        //修改为文字模式
        dev.changeMode(Developer.MODE.TEXT_MODE);

        //修改为缩放模式
        // dev.changeMode(Developer.MODE.SCALE_MODE);

        scaleEle['value'] = dev.getScale();
    }
);

window.onresize = (e) => {
    devCanvas.resizeJanvasDev(window.innerWidth, window.innerHeight, () => {
        scaleEle['value'] = devCanvas.getScale();
    });
}

document.getElementById('change-btn').onclick = (e) => {
    devCanvas.setScale(scaleEle['value']);
}

document.getElementById('console-btn').onclick = (e) => {
    console.info(devCanvas.getScale());
}

document.getElementById('update-btn').onclick = (e) => {
    devCanvas.updateJanvasData(data, {});
}

devCanvas.addEventHandler(Developer.EVENTS.ELEMENT_SELECTED, (janvasElement) => {
    //something
    console.info(janvasElement.elementId + ' has been choosed!');
    console.log(janvasElement);
});

devCanvas.addEventHandler(Developer.EVENTS.ELEMENT_CHANGED, (janvasElement) => {
    //something
    console.info(janvasElement.elementId + ' has been changed!');
    console.log(janvasElement);

    devCanvas.updateJanvasData(data, {});
});

devCanvas.addEventHandler(Developer.EVENTS.TEXT_CHANGED, (addedData) => {
    //something
    console.info(addedData);

    devCanvas.updateJanvasData(data, {});
});

devCanvas.addEventHandler(Developer.EVENTS.SCALE_CHANGED, (scaleNum) => {
    //something
    console.info(scaleNum);
});
