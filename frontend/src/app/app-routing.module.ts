import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DgrComplianceComponent } from './components/dgr-compliance/dgr-compliance.component';
import { DgConverterComponent } from './components/dg-converter/dg-converter.component';
import { JsonConverterComponent } from './components/json-converter/json-converter.component';
import { DgShipmentComponent } from './components/dg-shipment/dg-shipment.component';

const routes: Routes = [
  { path: '', redirectTo: '/dg-shipment', pathMatch: 'full' },
  { path: 'dgr-compliance', component: DgrComplianceComponent },
  { path: 'dg-shipment', component: DgShipmentComponent },
  { path: 'dg-converter', component: DgConverterComponent },
  { path: 'json-converter', component: JsonConverterComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
