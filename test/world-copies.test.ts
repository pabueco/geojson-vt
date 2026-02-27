
import {describe, test, expect} from 'vitest';
import {GeoJSONVT} from '../src';

function point(coordinates: [number, number]): GeoJSON.Feature<GeoJSON.Point> {
    return {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates}};
}

function lineString(coordinates: [number, number][]): GeoJSON.Feature<GeoJSON.LineString> {
    return {type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates}};
}

function polygon(coordinates: [number, number][][]): GeoJSON.Feature<GeoJSON.Polygon> {
    return {type: 'Feature', properties: {}, geometry: {type: 'Polygon', coordinates}};
}

describe('worldCopies: true', () => {
    test('line crossing antimeridian is duplicated with buffer overlap', () => {
        const vt = new GeoJSONVT(lineString([[170, 0], [190, 0]]));
        const tile = vt.getTile(0, 0, 0);
        expect(tile.features.length).toBe(2);
    });
});

describe('worldCopies: false', () => {
    test('line crossing antimeridian is clipped without overlap', () => {
        const vt = new GeoJSONVT(lineString([[170, 0], [190, 0]]), {
            worldCopies: false,
        });
        const tile = vt.getTile(0, 0, 0);
        expect(tile.features.length).toBe(2);
    });

    test('polygon crossing antimeridian is split into two', () => {
        const vt = new GeoJSONVT(polygon([[
            [170, 10], [190, 10], [190, -10], [170, -10], [170, 10]
        ]]), {
            worldCopies: false,
        });
        const tile = vt.getTile(0, 0, 0);
        expect(tile.features.length).toBe(2);
        expect(tile.features[0].type).toBe(3);
        expect(tile.features[1].type).toBe(3);
    });

    test('point at exactly 180° is preserved', () => {
        const vt = new GeoJSONVT(point([180, 0]), {
            worldCopies: false,
        });
        const tile = vt.getTile(0, 0, 0);
        expect(tile.features.length).toBe(1);
    });

    test('point at 540° is shifted back', () => {
        const vt = new GeoJSONVT(point([540, 0]), {
            worldCopies: false,
        });
        const tile = vt.getTile(0, 0, 0);
        expect(tile.features.length).toBe(1);
    });

    test('works at higher zoom levels', () => {
        const vt = new GeoJSONVT(polygon([[
            [170, 10], [190, 10], [190, -10], [170, -10], [170, 10]
        ]]), {
            worldCopies: false,
            maxZoom: 2,
            indexMaxZoom: 2,
        });

        const rightEdgeTile = vt.getTile(2, 3, 1);
        expect(rightEdgeTile).not.toBeNull();
        expect(rightEdgeTile.features.length).toBeGreaterThan(0);

        const leftEdgeTile = vt.getTile(2, 0, 1);
        expect(leftEdgeTile).not.toBeNull();
        expect(leftEdgeTile.features.length).toBeGreaterThan(0);
    });
});
