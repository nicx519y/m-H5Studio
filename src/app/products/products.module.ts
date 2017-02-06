import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes, RouterLink } from '@angular/router';
import { HttpModule } from '@angular/http';
// import { AppCommonModule } from '../app-common/app-common.module';
import { ProductsService } from '../products.service';
import { ProductsComponent } from './products.component';
import { MaterialModule } from '@angular/material';

const ROUTES: Routes = [
	{path: 'products', component: ProductsComponent}
];

@NgModule({
	imports: [
		RouterModule.forChild(ROUTES),
		MaterialModule,
		CommonModule,
		HttpModule,
		// AppCommonModule,
	],
	declarations: [
		ProductsComponent,
	],
	providers: [
		ProductsService
	],
	exports: [
		ProductsComponent
	]
})
export class ProductsModule {
	
}
