node-abif
=========

An ABIF reader for node

    var fs = require('fs'),
        abif = require('abif');

    fs.readFile('./mitochondrion/chromatogram/JuneBBC-10-LCMtF.ab1', function(err, data){
        var reader = abif(data);
        console.log('Run start date', reader.getRunStartDate());
        console.log('Signal to Noise', reader.getData('S/N%', 1));
        reader.showEntries();
    });
