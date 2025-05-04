// This file is purely for debugging Netlify deployments
(function() {
  console.log('DesignKorv build-info.js loaded');
  
  // Show page information
  const pageInfo = {
    path: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    href: window.location.href,
    host: window.location.host,
    userAgent: navigator.userAgent
  };
  
  console.log('Page information:', pageInfo);
  
  // Check if base tag exists and log its value
  const baseTag = document.querySelector('base');
  console.log('Base tag:', baseTag ? baseTag.getAttribute('href') : 'Not found');
  
  // Create diagnostic element
  function createDiagnosticElement() {
    // Only create the diagnostic element if the page is blank (no child elements in body except scripts)
    const nonScriptElements = Array.from(document.body.children).filter(el => el.tagName !== 'SCRIPT');
    
    if (nonScriptElements.length <= 1) { // Allow for the root div
      const diagnosticDiv = document.createElement('div');
      diagnosticDiv.style.margin = '20px';
      diagnosticDiv.style.padding = '20px';
      diagnosticDiv.style.border = '1px solid #ccc';
      diagnosticDiv.style.borderRadius = '5px';
      diagnosticDiv.style.fontFamily = 'Arial, sans-serif';
      
      const h1 = document.createElement('h1');
      h1.textContent = 'DesignKorv Diagnostic Information';
      diagnosticDiv.appendChild(h1);
      
      const p = document.createElement('p');
      p.textContent = 'This page appears to be loading incorrectly. Here is some diagnostic information:';
      diagnosticDiv.appendChild(p);
      
      const ul = document.createElement('ul');
      Object.entries(pageInfo).forEach(([key, value]) => {
        const li = document.createElement('li');
        li.textContent = `${key}: ${value}`;
        ul.appendChild(li);
      });
      diagnosticDiv.appendChild(ul);
      
      const scriptsPara = document.createElement('p');
      scriptsPara.textContent = 'Loaded scripts:';
      diagnosticDiv.appendChild(scriptsPara);
      
      const scriptsList = document.createElement('ul');
      Array.from(document.scripts).forEach(script => {
        const li = document.createElement('li');
        li.textContent = script.src || 'Inline script';
        scriptsList.appendChild(li);
      });
      diagnosticDiv.appendChild(scriptsList);
      
      document.body.appendChild(diagnosticDiv);
    }
  }
  
  // Add listener for DOMContentLoaded to check if page is blank after everything loads
  window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    // Wait a bit to allow React to render
    setTimeout(createDiagnosticElement, 2000);
  });
  
  // Also check after window load as a last resort
  window.addEventListener('load', () => {
    console.log('Window load event fired');
    setTimeout(createDiagnosticElement, 3000);
  });
})();