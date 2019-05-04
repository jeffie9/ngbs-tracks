import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryComponent } from './library.component';
import { TrackService } from './track.service';

describe('LibraryComponent', () => {
  let component: LibraryComponent;
  let fixture: ComponentFixture<LibraryComponent>;
  let trackService = jasmine.createSpyObj('TrackService', ['getTrackLibrary']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LibraryComponent ],
      providers: [
        { provide: TrackService, useValue: trackService },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
