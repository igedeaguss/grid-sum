// Grid Sum 3x3 — logika
(() => {
  const SIZE = 3;
  const MIN = 1, MAX = 9;

  // state puzzle saat ini
  let rowTargets = [];
  let colTargets = [];
  let solution = []; // grid 3x3 yang valid (untuk membangkitkan target). Tidak digunakan untuk validasi jawaban.

  // elemen
  const colHeaderRow = document.getElementById('colHeaderRow');
  const gridBody = document.getElementById('gridBody');
  const message = document.getElementById('message');
  const btnNew = document.getElementById('newPuzzleBtn');
  const btnClear = document.getElementById('clearBtn');
  const btnCheck = document.getElementById('checkBtn');

  // utils
  const rng = (n) => Math.floor(Math.random() * n);
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = rng(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const range = (a, b) => Array.from({length: b - a + 1}, (_, i) => a + i);

  function setMessage(text, type = '') {
    message.textContent = text || '';
    message.className = 'message ' + (type || '');
  }

  // Bangkitkan grid solusi acak (memenuhi: angka 1-9, tidak duplikat dalam baris/kolom)
  function generateSolution() {
    const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    const rowSets = Array.from({ length: SIZE }, () => new Set());
    const colSets = Array.from({ length: SIZE }, () => new Set());

    const nums = range(MIN, MAX);

    function backtrack(r = 0, c = 0) {
      if (r === SIZE) return true;
      const nextR = c === SIZE - 1 ? r + 1 : r;
      const nextC = c === SIZE - 1 ? 0 : c + 1;

      const candidates = shuffle(nums.slice());
      for (const v of candidates) {
        if (rowSets[r].has(v) || colSets[c].has(v)) continue;
        // place
        grid[r][c] = v;
        rowSets[r].add(v);
        colSets[c].add(v);

        if (backtrack(nextR, nextC)) return true;

        // undo
        grid[r][c] = 0;
        rowSets[r].delete(v);
        colSets[c].delete(v);
      }
      return false;
    }

    const ok = backtrack();
    if (!ok) throw new Error('Gagal membangkitkan solusi');
    return grid;
  }

  function computeRowSums(grid) {
    return grid.map(row => row.reduce((a, b) => a + b, 0));
  }
  function computeColSums(grid) {
    const sums = Array(SIZE).fill(0);
    for (let c = 0; c < SIZE; c++) {
      let s = 0;
      for (let r = 0; r < SIZE; r++) s += grid[r][c];
      sums[c] = s;
    }
    return sums;
  }

  // Render tabel (header target kolom + baris dengan target kiri)
  function renderBoard() {
    // header kolom
    colHeaderRow.innerHTML = '<th class="corner"></th>' + colTargets
      .map((t, ci) => `<th id="col-target-${ci}" class="target" aria-label="Target kolom ${ci+1}">${t}</th>`)
      .join('');

    // body
    gridBody.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.className = 'row-target target';
      th.id = `row-target-${r}`;
      th.textContent = rowTargets[r];
      th.setAttribute('aria-label', `Target baris ${r+1}`);
      tr.appendChild(th);

      for (let c = 0; c < SIZE; c++) {
        const td = document.createElement('td');
        td.className = 'cell';
        const input = document.createElement('input');
        input.type = 'number';
        input.min = String(MIN);
        input.max = String(MAX);
        input.inputMode = 'numeric';
        input.id = `cell-${r}-${c}`;
        input.addEventListener('input', (e) => {
          // bersihkan styling ketika user mengetik
          input.classList.remove('invalid', 'duplicate', 'sum-mismatch', 'ok');
          setMessage('');
          // pastikan nilai tetap 1..9
          const val = parseInt(input.value, 10);
          if (!Number.isNaN(val)) {
            if (val < MIN) input.value = String(MIN);
            if (val > MAX) input.value = String(MAX);
          }
        });
        td.appendChild(input);
        tr.appendChild(td);
      }
      gridBody.appendChild(tr);
    }
  }

  function solveCount(rowTargets, colTargets) {
    let count = 0;
    const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    const rowSets = Array.from({ length: SIZE }, () => new Set());
    const colSets = Array.from({ length: SIZE }, () => new Set());
  
    function backtrack(r, c) {
      if (count > 1) return; // stop kalau sudah lebih dari 1 solusi
      if (r === SIZE) {
        count++;
        return;
      }
      const nextR = c === SIZE - 1 ? r + 1 : r;
      const nextC = c === SIZE - 1 ? 0 : c + 1;
  
      for (let val = MIN; val <= MAX; val++) {
        if (rowSets[r].has(val) || colSets[c].has(val)) continue;
        grid[r][c] = val;
        rowSets[r].add(val);
        colSets[c].add(val);
  
        // pruning: kalau sudah penuh di baris ini, cek sum
        if (c === SIZE - 1) {
          const sumR = grid[r].reduce((a, b) => a + b, 0);
          if (sumR !== rowTargets[r]) {
            rowSets[r].delete(val);
            colSets[c].delete(val);
            continue;
          }
        }
        // pruning: kalau sudah penuh di kolom ini, cek sum
        if (r === SIZE - 1) {
          let sumC = 0;
          for (let rr = 0; rr < SIZE; rr++) sumC += grid[rr][c];
          if (sumC !== colTargets[c]) {
            rowSets[r].delete(val);
            colSets[c].delete(val);
            continue;
          }
        }
  
        backtrack(nextR, nextC);
  
        rowSets[r].delete(val);
        colSets[c].delete(val);
      }
    }
  
    backtrack(0, 0);
    return count;
  }
  

  function newPuzzle() {
    let tries = 0;
    while (true) {
      tries++;
      solution = generateSolution();
      rowTargets = computeRowSums(solution);
      colTargets = computeColSums(solution);
  
      const allTargets = [...rowTargets, ...colTargets];
      const uniqueCount = new Set(allTargets).size;
      if (uniqueCount !== allTargets.length) continue; // target harus unik

      const solutions = solveCount(rowTargets, colTargets);
      if (solutions === 1) break; // hanya lanjut jika tepat 1 solusi
      if (tries > 2000) {
        console.warn("Sulit menemukan puzzle 1 solusi, pakai yang ada...");
        break;
      }
    }
  
    renderBoard();

  }
  

  function clearBoard() {
    document.querySelectorAll('.cell input').forEach(inp => {
      inp.value = '';
      inp.classList.remove('invalid', 'duplicate', 'sum-mismatch', 'ok');
    });
    // bersihkan highlight target
    for (let r = 0; r < SIZE; r++) {
      document.getElementById(`row-target-${r}`)?.classList.remove('sum-mismatch', 'ok');
    }
    for (let c = 0; c < SIZE; c++) {
      document.getElementById(`col-target-${c}`)?.classList.remove('sum-mismatch', 'ok');
    }
    setMessage('');
  }

  function readGrid() {
    const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    let allFilled = true;
    document.querySelectorAll('.cell input').forEach(inp => inp.classList.remove('invalid', 'duplicate', 'sum-mismatch', 'ok'));

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const el = document.getElementById(`cell-${r}-${c}`);
        const v = parseInt(el.value, 10);
        if (Number.isNaN(v)) {
          allFilled = false;
          grid[r][c] = null;
        } else {
          grid[r][c] = v;
          if (v < MIN || v > MAX) {
            el.classList.add('invalid');
          }
        }
      }
    }
    return { grid, allFilled };
  }

  function markRow(r, cls, on = true) {
    for (let c = 0; c < SIZE; c++) {
      const el = document.getElementById(`cell-${r}-${c}`);
      if (on) el.classList.add(cls); else el.classList.remove(cls);
    }
  }
  function markCol(c, cls, on = true) {
    for (let r = 0; r < SIZE; r++) {
      const el = document.getElementById(`cell-${r}-${c}`);
      if (on) el.classList.add(cls); else el.classList.remove(cls);
    }
  }

  function checkAnswer() {
    const { grid, allFilled } = readGrid();
    // Hapus semua highlight sebelum validasi baru
    document.querySelectorAll('.cell input').forEach(inp => {
      inp.classList.remove('invalid', 'duplicate', 'sum-mismatch', 'ok');
    });
    for (let r = 0; r < SIZE; r++) {
      document.getElementById(`row-target-${r}`).classList.remove('sum-mismatch', 'ok');
    }
    for (let c = 0; c < SIZE; c++) {
      document.getElementById(`col-target-${c}`).classList.remove('sum-mismatch', 'ok');
    }


    // reset target highlight
    for (let r = 0; r < SIZE; r++) document.getElementById(`row-target-${r}`).classList.remove('sum-mismatch', 'ok');
    for (let c = 0; c < SIZE; c++) document.getElementById(`col-target-${c}`).classList.remove('sum-mismatch', 'ok');

    let ok = true;
    let problems = [];

    // validasi isi
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = grid[r][c];
        if (v === null) {
          ok = false;
        } else if (v < MIN || v > MAX) {
          ok = false;
          problems.push('Ada angka di luar rentang 1–9.');
        }
      }
    }

    // cek duplikasi baris + sum baris
    for (let r = 0; r < SIZE; r++) {
      const seen = new Map();
      let sum = 0;
      for (let c = 0; c < SIZE; c++) {
        const v = grid[r][c];
        if (v === null) continue;
        sum += v;
        seen.set(v, (seen.get(v) || 0) + 1);
      }
      // duplicate
      for (let c = 0; c < SIZE; c++) {
        const v = grid[r][c];
        if (v !== null && seen.get(v) > 1) {
          ok = false;
        }
      }
      // sum mismatch (hanya evaluasi jika baris terisi penuh)
      if (grid[r].every(v => v !== null)) {
        if (sum !== rowTargets[r]) {
          ok = false;
        } else {
        }
      }
    }

    // cek duplikasi kolom + sum kolom
    for (let c = 0; c < SIZE; c++) {
      const seen = new Map();
      let sum = 0;
      for (let r = 0; r < SIZE; r++) {
        const v = grid[r][c];
        if (v === null) continue;
        sum += v;
        seen.set(v, (seen.get(v) || 0) + 1);
      }
      for (let r = 0; r < SIZE; r++) {
        const v = grid[r][c];
        if (v !== null && seen.get(v) > 1) {
          ok = false;
        }
      }
      if (grid.every(row => row[c] !== null)) {
        if (sum !== colTargets[c]) {
          ok = false;
        } else {
        }
      }
    }

    if (!allFilled) {
      problems.push('Lengkapi semua sel terlebih dahulu.');
    }

    if (ok && allFilled) {
      setMessage('✅ Jawaban Benar', 'success');
    } else {
      setMessage('❌ Jawaban Salah', 'error');
    }
  }

  // event handlers
  btnNew.addEventListener('click', () => { newPuzzle(); clearBoard(); });
  btnClear.addEventListener('click', clearBoard);
  btnCheck.addEventListener('click', checkAnswer);

  // pertama kali: acak puzzle
  newPuzzle();
})();
