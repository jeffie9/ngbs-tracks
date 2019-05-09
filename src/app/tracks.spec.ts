import { Track, TrackRef, TrackPath } from './track';
import { Matrix } from './matrix';
import { closestPoints } from './geometry';


describe('Tracks', () => {
    let tS80 = new Track();
    tS80.paths = [new TrackPath(-40, 0, 40, 0)];
    let tCF133 = new Track();
    tCF133.paths = [new TrackPath(-26.012042935483763, 2.5619626129026187, 26.012042935483763, 2.5619626129026187, 0, 133.33333333333334, 133.33333333333334)];
    let tX30 = new Track();
    tX30.paths = [
        new TrackPath(-38.63703305156273, -10.35276180410083, -38.63703305156273, 10.35276180410083),
        new TrackPath(-38.63703305156273, 10.35276180410083, -38.63703305156273, -10.35276180410083)
    ];
    let tTL5 = new Track();
    tTL5.paths = [
        new TrackPath(-40, 0, 40, 0),
        new TrackPath(-38.446454055273605, 15.689290811054724, 40, 0, 39.999999999999986, 203.9607805437113, 203.9607805437113)
    ];
    let tTR5 = new Track();
    tTR5.paths = [
        new TrackPath(-40, 0, 40, 0),
        new TrackPath(-40, 0, 38.44645405527355, 15.689290811054713, -39.99999999999999, 203.9607805437112, 203.9607805437112)
    ];


    describe('snap', () => {
        it('turnouts at branches', () => {
            let tc1 = new TrackRef(tTL5, 470, 117, 0);
            let tc2 = new TrackRef(tTR5, 468.5449086442771, 101.55416906791874, -3.910175948124065);

            let res = tc2.snapTo(tc1);

            console.log('res', res, res.da * 180 / Math.PI);
            let matF = new Matrix()
                .translate(res.dx, res.dy)
                .translate(res.x, res.y)
                .rotate(res.da)
                .translate(-res.x, -res.y);
            let f = matF.applyToPoint(tc2.xc, tc2.yc);
            console.log('f', f);
        });

        it('turnout branch to main', () => {
            // special case: these TrackRefs have a common point
            let trA = new TrackRef(tTR5, 468.5449086442771, 101.55416906791874, -3.910175948124065);
            let trB = new TrackRef(tTL5, 470, 117, 0);

            let matA = new Matrix().translate(trA.xc,  trA.yc).rotate(trA.rot);
            let pathsA = trA.track.paths.map(p => p.transform(matA));
            let ptsA = pathsA
                .map(p => [p.x1, p.y1, p.x2, p.y2])
                .reduce((acc, cur) => acc.concat(cur));
            

            let matB = new Matrix().translate(trB.xc,  trB.yc).rotate(trB.rot);
            let pathsB = trB.track.paths.map(p => p.transform(matB));
            let ptsB = pathsB
                .map(p => [p.x1, p.y1, p.x2, p.y2])
                .reduce((acc, cur) => acc.concat(cur));

            console.log('reduced paths', ptsA, ptsB);

            let cp = closestPoints(ptsA, ptsB);
            console.log('closest points', cp);

            let targetX = ptsB[cp[1]];
            let targetY = ptsB[cp[1]+1];
            console.log('target', ptsB[cp[1]], ptsB[cp[1]+1]);
            console.log('me', ptsA[cp[0]], ptsA[cp[0]+1]);
            console.log('A path / point', Math.floor(cp[0] / 4), cp[0] % 4);
            console.log('B path / point', Math.floor(cp[1] / 4), cp[1] % 4);

            let tpA = pathsA[Math.floor(cp[0] / 4)];
            let tpB = pathsB[Math.floor(cp[1] / 4)];

            console.log('paths', tpA, tpB);

            let angA = tpA.calcAngleAtPoint(ptsA[cp[0]], ptsA[cp[0]+1]);
            let angB = tpB.calcAngleAtPoint(ptsB[cp[1]], ptsB[cp[1]+1]);

            console.log('angles', angA, angB, (angB - angA) * 180 / Math.PI);

            let matF = new Matrix()
                .translate(targetX, targetY)
                .rotate(angB - angA + Math.PI)
                .translate(-targetX, -targetY);
            let f = matF.applyToPoint(trA.xc, trA.yc);

            console.log('f', f);
        });

        it('turnout branch to main (try with points)', () => {
            // special case: these TrackRefs have a common point
            let trA = new TrackRef(tTR5, 468.5449086442771, 101.55416906791874, -3.910175948124065);
            let trB = new TrackRef(tTL5, 470, 117, 0);

            let matA = new Matrix().translate(trA.xc,  trA.yc).rotate(trA.rot);
            let ptsA = trA.track.paths
                .map(p => [p.x1, p.y1, p.x2, p.y2])
                .map(arr => matA.applyToArray(arr) as number[])
                .reduce((acc, cur) => acc.concat(cur));
            

            let matB = new Matrix().translate(trB.xc,  trB.yc).rotate(trB.rot);
            let ptsB = trB.track.paths
                .map(p => [p.x1, p.y1, p.x2, p.y2])
                .map(arr => matB.applyToArray(arr) as number[])
                .reduce((acc, cur) => acc.concat(cur));

            console.log('reduced paths', ptsA, ptsB);

            let cp = closestPoints(ptsA, ptsB);
            console.log('closest points', cp);
            console.log('target', ptsB[cp[1]], ptsB[cp[1]+1]);
            console.log('me', ptsA[cp[0]], ptsA[cp[0]+1]);
            console.log('A path / point', Math.floor(cp[0] / 4), cp[0] % 4);
            console.log('B path / point', Math.floor(cp[1] / 4), cp[1] % 4);

            let tpA = trA.track.paths[Math.floor(cp[0] / 4)];
            let tpB = trB.track.paths[Math.floor(cp[1] / 4)];

            console.log('paths', tpA, tpB);

            let ptA = cp[0] % 4 === 0 ? [tpA.x1, tpA.y1] : [tpA.x2, tpA.y2];
            let ptB = cp[1] % 4 === 0 ? [tpB.x1, tpB.y1] : [tpB.x2, tpB.y2];

            console.log('orig points', ptA, ptB);
            
            let angA = tpA.calcAngleAtPoint(ptA[0], ptA[1]) + trA.rot;
            let angB = tpB.calcAngleAtPoint(ptB[0], ptB[1]) + trB.rot;

            console.log('angles', angA, angB, (angB - angA) * 180 / Math.PI);
        });
    });

    describe('paths', () => {
        it('calc angle for curve', () => {
            let r = 100;
            let x2 = Math.cos(22.5 * Math.PI / 180) * r;
            let y2 = Math.sin(22.5 * Math.PI / 180) * r;
            
            let tp = new TrackPath(0, 0, x2, y2, 100, 0, 100);

            let a = tp.calcAngleAtPoint(x2, y2);
            console.log('angle at point', x2, y2, a * 180 / Math.PI);
        });

        it('transforms identity', () => {
            let transformed = tCF133.paths[0].transform(new Matrix());

            expect(transformed).toEqual(tCF133.paths[0]);
        });

        it('transforms 90 degrees', () => {
            let transformed = tCF133.paths[0].transform(new Matrix().rotateDeg(90));
            console.log(transformed);
        });
    });
});