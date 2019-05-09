export function dist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

export function closestPoints(a: number[], b: number[]): number[] {
    let ai: number, bi: number, minDist = Number.MAX_VALUE;

    for (let i = 0; i < a.length; i += 2) {
        for (let j = 0; j < b.length; j += 2) {
            let d = dist(a[i], a[i+1], b[j], b[j+1]);
            if (d < minDist) {
                minDist = d;
                ai = i;
                bi = j;
            }
        }
    }

    return [ai, bi, minDist];
}

export function angleBetweenPoints(
        xc: number, yc: number,
        x1: number, y1: number,
        x2: number, y2: number): number {
    let a = Math.abs(Math.atan2(y1 - yc, x1 - xc) - Math.atan2(y2 - yc, x2 - xc));
    if (a > 2 * Math.PI) {
        console.log('reduce a', a, a - 2 * Math.PI);
        a -= 2 * Math.PI;
    } else if (a < 0) {
        console.log('increase a', a, a + 2 * Math.PI);
        a += 2 * Math.PI;
    }
    return a;
}

