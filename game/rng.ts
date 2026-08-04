import type { SeededRng } from "./types";

/** 使用 32 位线性同余算法，保证浏览器与测试环境得到相同序列。 */
export function createRng(seed: number): SeededRng {
  let current = seed >>> 0;

  function nextUint32() {
    current = (Math.imul(current, 1_664_525) + 1_013_904_223) >>> 0;
    return current;
  }

  return {
    get state() {
      return current;
    },
    nextFloat() {
      return nextUint32() / 0x1_0000_0000;
    },
    integer(min: number, max: number) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
        throw new Error("随机整数范围无效");
      }
      return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    },
    die() {
      return this.integer(1, 6);
    },
  };
}
