const customTitlebar = require('custom-electron-titlebar');

        // window.addEventListener('DOMContentLoaded', () => {
        //     new customTitlebar.Titlebar({
        //         backgroundColor: customTitlebar.Color.fromHex('#1a1575  '),

        //         menu: null,
        //     });
        // })
        // document.title = 'Tyrolium Launcher';
        // titlebar.updateTitle();
        //titlebar.updateIcon('./asset/logo.png');

let bar = new customTitlebar.Titlebar({
    menu: null,
    backgroundColor: customTitlebar.Color.fromHex('#1a1575'),
});
bar.updateTitle("Tyrolium Launcher");