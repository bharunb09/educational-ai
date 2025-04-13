// src/app/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  Observable } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserserviceService {
  private apiUrl = 'http://localhost:8000'; // Change to HTTP for local development

  constructor(private http: HttpClient) {}


}
