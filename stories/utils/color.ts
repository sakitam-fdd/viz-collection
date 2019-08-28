export function colorHex(str: string){
  // 十六进制颜色值的正则表达式
  const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
  // 如果是rgb颜色表示
  if (/^(rgb|RGB)/.test(str)) {
    const aColor = str.replace(/(?:\(|\)|rgb|RGB)*/g, '').split(',');
    let strHex = '#';
    for (let i = 0; i < aColor.length; i++) {
      let hex = Number(aColor[i]).toString(16);
      if (hex.length < 2) {
        hex = `0${hex}`;
      }
      strHex += hex;
    }
    if (strHex.length !== 7) {
      strHex = str;
    }
    return strHex;
  }
  if (reg.test(str)) {
    const aNum = str.replace(/#/, '').split('');
    if (aNum.length === 6) {
      return str;
    }
    if (aNum.length === 3) {
      let numHex = '#';
      for (let i = 0; i < aNum.length; i += 1) {
        numHex += (aNum[i] + aNum[i]);
      }
      return numHex;
    }
  }
  return str;
}

export function colorThreeHex(str: string){
  // 十六进制颜色值的正则表达式
  const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
  // 如果是rgb颜色表示
  if (/^(rgb|RGB)/.test(str)) {
    const aColor = str.replace(/(?:\(|\)|rgb|RGB)*/g, '').split(',');
    let strHex = '0x';
    for (let i = 0; i < aColor.length; i++) {
      let hex = Number(aColor[i]).toString(16);
      if (hex.length < 2) {
        hex = `0${hex}`;
      }
      strHex += hex;
    }
    if (strHex.length !== 8) {
      strHex = str;
    }
    return Number(strHex);
  }
  if (reg.test(str)) {
    const aNum = str.replace(/#/, '').split('');
    if (aNum.length === 6) {
      return Number(str.replace('#', '0x'));
    }
    if (aNum.length === 3) {
      let numHex = '0x';
      for (let i = 0; i < aNum.length; i += 1) {
        numHex += (aNum[i] + aNum[i]);
      }
      return Number(numHex);
    }
  }
  return str;
}
