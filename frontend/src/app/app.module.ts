import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DgrComplianceComponent } from './components/dgr-compliance/dgr-compliance.component';
import { DgConverterComponent } from './components/dg-converter/dg-converter.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { JsonConverterComponent } from './components/json-converter/json-converter.component';
import { DgShipmentComponent } from './components/dg-shipment/dg-shipment.component';

@NgModule({
  declarations: [
    AppComponent,
    DgrComplianceComponent,
    DgConverterComponent,
    ChatbotComponent,
    JsonConverterComponent,
    DgShipmentComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
