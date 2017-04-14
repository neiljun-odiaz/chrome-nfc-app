var compatibleDevices = [
    {
        deviceName: 'ACR122U USB NFC Reader',
        productId: 0x2200,
        vendorId: 0x072f,
        thumbnailURL: chrome.runtime.getURL('images/acr122u.png')
    }
]

var device = null;
var tag_detected = false;
var tag_checker = null;

function log(message, object) {
    var logArea = document.querySelector('.logs');
    var pre = document.createElement('pre');
    pre.textContent = message;
    if (object)
        pre.textContent += ': ' + JSON.stringify(object, null, 2) + '\n';
    logArea.appendChild(pre);
    logArea.scrollTop = logArea.scrollHeight;
    document.querySelector('#logContainer').classList.remove('small');
}

function handleDeviceTimeout(func, args) {
    var timeoutInMs = 1000;
    var hasTags = false;
    setTimeout(function () {
        if (!hasTags) {
            log('Timeout! No tag detected');
        }
    }, timeoutInMs);
    var args = args || [];
    args = args.concat([function () {
        hasTags = true;
    }]);
    func.apply(this, args);
}

function readNdefTag(callback) {
    chrome.nfc.read(device, {}, function (type, ndef) {
        log('Found ' + ndef.ndef.length + ' NFC Tag(s)');
        for (var i = 0; i < ndef.ndef.length; i++) {
            log('NFC Tag', ndef.ndef[i]);
        }
        tag_detected = true;
        callback();
    });
}

function onWriteNdefTagButtonClicked() {
    var ndefType = document.querySelector('#write-ndef-type').value;
    var ndefValue = document.querySelector('#write-ndef-value').value;
    handleDeviceTimeout(writeNdefTag, [ndefType, ndefValue]);
}

function writeNdefTag(ndefType, ndefValue, callback) {
    var ndef = {};
    ndef[ndefType] = ndefValue;
    chrome.nfc.write(device, {"ndef": [ndef]}, function (rc) {
        if (!rc) {
            log('NFC Tag written!');
        } else {
            log('NFC Tag write operation failed', rc);
        }
        callback();
    });
}

function showDeviceInfo() {
    var deviceInfo = null;
    for (var i = 0; i < compatibleDevices.length; i++) {
        if (device.productId === compatibleDevices[i].productId &&
            device.vendorId === compatibleDevices[i].vendorId) {
            deviceInfo = compatibleDevices[i];
        }
    }

    if (!deviceInfo)
        return;

    var thumbnail = document.querySelector('#device-thumbnail');
    thumbnail.src = deviceInfo.thumbnailURL;
    thumbnail.classList.remove('hidden');

    var deviceName = document.querySelector('#device-name');
    deviceName.textContent = deviceInfo.deviceName;

    var productId = document.querySelector('#device-product-id');
    productId.textContent = deviceInfo.productId;

    var vendorId = document.querySelector('#device-vendor-id');
    vendorId.textContent = deviceInfo.vendorId;
}

function enumerateDevices() {
    chrome.nfc.findDevices(function (devices) {
        device = devices[0];
        showDeviceInfo();
        runTagChecker();
    });
}

function runTagChecker() {
    if ( !tag_detected ) {
        tag_checker = setInterval(function () {
            readNdefTag(function () {
                tag_detected = true;
                checkTagDetected();
            });
        }, 1000);
    }
}

function checkTagDetected() {
    if ( tag_detected ) {
        clearInterval(tag_checker);
        return false;
    }
}

enumerateDevices();
document.querySelector('#write-ndef button').addEventListener('click', onWriteNdefTagButtonClicked);
document.querySelector('.drawer').addEventListener('click', function (e) {
    document.querySelector('#logContainer').classList.toggle('small');
});
