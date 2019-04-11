import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { LayoutComponent } from './layout.component';
import { LibraryComponent } from './library.component';
import { TrackEditorComponent } from './track-editor.component';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    LibraryComponent,
    TrackEditorComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
