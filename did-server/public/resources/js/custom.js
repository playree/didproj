function setModalValues(modal_id, values_id = '') {
  const modal = document.getElementById(modal_id);
  let values;
  if (values_id) {
    values = document.getElementById(values_id);
  }

  const targets = modal.getElementsByClassName('_values');
  for(let i=0; i < targets.length; i++) {
    if (values) {
      const item = values.querySelector('[name="' + targets[i].name + '"]');
      if (item) {
        targets[i].value = item.value;
        continue;    
      }
    }
    targets[i].value = '';
  }
}
