assert = require ('assert');
geo = require ('../lib/geo');

function octet (){
    return Math.random() * 254;
}

function generateIP () {
    return octet() + "." + octet() + "." + octet() + "." + octet();
}

start = process.hrtime();
geo.loadData();
diff = process.hrtime(start);
msec = Math.round (diff[0] * 1e9 + diff[1]) / 1e6;
console.log ("Time taken to build the lookup table (prefix tree): " + msec + " ms.");
//geo.printSample();

describe ('IP Conversion', function () {
    describe ('ip2long()', function () {
        it ('IP should be converted to the long format', function () {
            assert.equal(geo.ip2long('87.229.134.24'), 1474659864);
            assert.equal(geo.ip2long('217.212.248.160'), 3654613152);
            assert.equal(geo.ip2long('188.65.186.96'), 3158424160);
        });
    });

    describe ('long2ip()', function () {
        it ('Long format should be converted to the ipv4 format', function () {
            assert.equal(geo.long2ip(1474659864), '87.229.134.24');
            assert.equal(geo.long2ip(3654613152), '217.212.248.160');
            assert.equal(geo.long2ip(3158424160), '188.65.186.96');
        });
    });
    describe ('lookup', function () {
        it('It should find country', function () {
            assert.equal (geo.lookup ('87.229.134.24'), 'RU');
            assert.equal (geo.lookup ('2.20.4.0'), 'IT');
        });

        it('It should return null for unknown IP', function () {
            assert.equal (geo.lookup ('1.1.1.1'), null);
        });

        it('It should be freaking fast', function () {
            start = process.hrtime();
            for (var i = 0; i < 1e4; ++i){
                geo.lookup( generateIP() );
            }
            diff = process.hrtime(start);
            msec = Math.round (diff[0] * 1e9 + diff[1]) / 1e6;
            assert (msec < 500, 'It is damn too slow: ' + msec + ' ms for 10k lookups');
        });

        it('Should still be very fast to do 100k lookups', function () {
            start = process.hrtime();
            for (var i = 0; i < 1e5; ++i){
                geo.lookup( generateIP() );
            }
            diff = process.hrtime(start);
            msec = Math.round (diff[0] * 1e9 + diff[1]) / 1e6;
            assert (msec < 5000, 'It is damn too slow: ' + msec + ' ms for 100k lookups');
        });

        it('Now the extreme: 1 million lookups, should be considerably fast', function () {
            start = process.hrtime();
            for (var i = 0; i < 1e6; ++i){
                geo.lookup( generateIP() );
            }
            diff = process.hrtime(start);
            msec = Math.round (diff[0] * 1e9 + diff[1]) / 1e6;
            assert (msec < 30000, 'It is damn too slow: ' + msec + ' ms for 1 million lookups');
        });


    });
});

