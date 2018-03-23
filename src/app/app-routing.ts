import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';



const appRoutes: Routes = [
    // { path: 'approvals', loadChildren: './approvals/approvals.module#ApprovalsModule' },

]

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes)
    ],
    providers: [],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }
