import { TestBed } from '@angular/core/testing';
import { AngularFirestore } from '@angular/fire/firestore';

import { TrackService } from './track.service';

describe('TrackService', () => {
  let firestoreService = jasmine.createSpyObj('AngularFirestore', ['']);

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      { provide: AngularFirestore, useValue: firestoreService }
    ],
  }));

  it('should be created', () => {
    const service: TrackService = TestBed.get(TrackService);
    expect(service).toBeTruthy();
  });
});
