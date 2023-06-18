//スライドショー
const imgs = [
    'url(../img/plan-1-1.jpg)',
    'url(../img/plan-1-2.jpg)',
    'url(../img/plan-1-3.jpg)'
];

const back = document.getElementById('js-back');
const next = document.getElementById('js-next');
const slide = document.getElementById('js-slide');

let count = 0;

const change = () => {
    slide.style.backgroundImage = imgs[count];
};

const goNext = () => {
    if (count == 2) {
        count = 0;
    } else {
        count++;
    }
    change();
};
const goBack = () => {
    if (count == 0) {
        count = 2;
    } else {
        count--;
    }
    change();
}

back.addEventListener('click', () => {
    goBack();
});
next.addEventListener('click', () => {
    goNext();
});