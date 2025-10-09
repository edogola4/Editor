import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Collaborative Code Editor</h1>
          <p>Welcome back! Please sign in to continue.</p>
        </div>
        <div class="auth-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px;
    }
    
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .auth-header {
      padding: 24px;
      text-align: center;
      background: #3f51b5;
      color: white;
    }
    
    .auth-header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
    }
    
    .auth-header p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }
    
    .auth-content {
      padding: 24px;
    }
    
    @media (max-width: 480px) {
      .auth-card {
        border-radius: 0;
      }
    }
  `]
})
export class AuthLayoutComponent { }
