document.getElementById('signup').addEventListener('click',this.openWindow);


function openWindow(ev){
    console.log('new window open');
    window.open('signup.html',null);
}