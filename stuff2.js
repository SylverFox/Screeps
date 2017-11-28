class A {
  constructor() {

  }

  get derp() {
    if(!this._derp) {
      console.log('init')
      this._derp = 1
    }
    return this._derp
  }
}

let b = new A()
console.log(b.derp)
b.derp++
console.log(b.derp)
