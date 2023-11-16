export default function disablePage(disabled: boolean) {
    if (disabled) {
        document.body.classList.add('disabled');
    } else {
        document.body.classList.remove('disabled');
    }
}