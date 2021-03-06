import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({ selector: 'app-library', template: ''})
class MockLibraryComponent {}

@Component({ selector: 'app-layout', template: ''})
class MockLayoutComponent {}

@Component({ selector: 'app-track-editor', template: ''})
class MockTrackEditorComponent {}

describe('AppComponent', () => {
    let firestoreService = jasmine.createSpyObj('AngularFirestore', ['']);
    beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MockLibraryComponent,
        MockLayoutComponent,
        MockTrackEditorComponent,
      ],
      providers: [
        { provide: AngularFirestore, useValue: firestoreService }
      ],
      }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'ngbs-tracks'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('ngbs-tracks');
  });

  it('should render navbar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('a.navbar-brand').textContent).toContain('Layout Designer');
  });
});
