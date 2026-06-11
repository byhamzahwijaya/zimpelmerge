// State management untuk aplikasi
const state = {
  activeMode: 'upload-mode', // 'upload-mode' atau 'path-mode'
  // Gambar disimpan dalam array dinamis (minimal 2)
  images: [
    { file: null, path: '', previewUrl: null, width: 0, height: 0, name: '' },
    { file: null, path: '', previewUrl: null, width: 0, height: 0, name: '' }
  ],
  config: {
    layout: 'horizontal',
    gap: 10,
    bgColor: 'transparent',
    suffix: '_combined',
    autoScale: true,
    customText: '',
    textColor: '#ffffff',
    textBgColor: '#000000'
  }
};

// Tunggu DOM selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi Lucide Icons
  lucide.createIcons();

  // Ambil elemen DOM utama
  const tabButtons = document.querySelectorAll('.tab-btn');
  const pathInputsGroup = document.getElementById('path-inputs-group');
  const dynamicPathContainer = document.getElementById('dynamic-path-inputs');
  const dropzonesContainer = document.getElementById('dropzones-container');
  const gapSlider = document.getElementById('gap-slider');
  const gapValueLabel = document.getElementById('gap-value');
  const colorPresets = document.querySelectorAll('.color-preset');
  const bgColorPicker = document.getElementById('bg-color-picker');
  const suffixInput = document.getElementById('output-suffix');
  const autoScaleCheck = document.getElementById('auto-scale');
  const customTextInput = document.getElementById('custom-text');
  const textColorPicker = document.getElementById('text-color-picker');
  const textBgPicker = document.getElementById('text-bg-picker');
  const btnMerge = document.getElementById('btn-merge');
  const resultBox = document.getElementById('result-box');
  const mergedOutputImg = document.getElementById('merged-output-img');
  const btnDownload = document.getElementById('btn-download');
  const outputPathIndicator = document.getElementById('output-path-indicator');
  const savedPathText = document.getElementById('saved-path-text');

  // ==========================================================================
  // INITIALIZATION & DYNAMIC RENDERING
  // ==========================================================================
  
  // Render pertama kali
  renderUI();

  function renderUI() {
    renderDropzones();
    renderPathInputs();
    checkValidation();
  }

  // Render dropzone cards secara dinamis berdasarkan state.images
  function renderDropzones() {
    dropzonesContainer.innerHTML = '';
    
    state.images.forEach((imgState, index) => {
      const isOptional = index >= 2;
      const numLabel = index + 1;
      let labelText = `Gambar ${numLabel}`;
      if (index === 0) labelText += ' (Utama)';
      else if (index === 1) labelText += ' (Detail)';
      else labelText += ' (Opsional)';

      const card = document.createElement('div');
      card.className = `dropzone-card ${imgState.previewUrl ? 'has-preview' : ''}`;
      card.id = `dropzone-${numLabel}`;
      card.setAttribute('data-index', index);

      // Buat file input tersembunyi
      const input = document.createElement('input');
      input.type = 'file';
      input.id = `file-input-${numLabel}`;
      input.accept = 'image/*';
      input.className = 'file-hidden-input';
      input.addEventListener('change', (e) => {
        if (input.files.length > 0) {
          handleFileSelect(input.files[0], index);
        }
      });
      card.appendChild(input);

      // Content area jika belum ada preview
      const content = document.createElement('div');
      content.className = `dropzone-content ${imgState.previewUrl ? 'hidden' : ''}`;
      content.innerHTML = `
        <div class="icon-circle">
          <i data-lucide="image-plus"></i>
        </div>
        <h3>${labelText}</h3>
        <p>Seret gambar ke sini atau <span>klik</span></p>
        <span class="file-info">Format: JPG, PNG, WEBP</span>
      `;
      card.appendChild(content);

      // Preview area jika sudah ada preview
      const preview = document.createElement('div');
      preview.className = `dropzone-preview ${imgState.previewUrl ? '' : 'hidden'}`;
      
      const img = document.createElement('img');
      img.src = imgState.previewUrl || '';
      img.alt = `Preview Gambar ${numLabel}`;
      preview.appendChild(img);

      const overlay = document.createElement('div');
      overlay.className = 'preview-overlay';
      
      const filename = document.createElement('span');
      filename.className = 'filename-tag';
      filename.textContent = `${imgState.name} (${imgState.width}x${imgState.height}px)`;
      overlay.appendChild(filename);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-btn';
      removeBtn.title = 'Hapus';
      removeBtn.innerHTML = '<i data-lucide="x"></i>';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFile(index);
      });
      overlay.appendChild(removeBtn);
      
      preview.appendChild(overlay);
      card.appendChild(preview);

      // Setup click event untuk memilih file
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-btn')) {
          input.click();
        }
      });

      // Setup drag and drop events per kartu
      setupDragEventsForCard(card, index);

      dropzonesContainer.appendChild(card);
    });

    lucide.createIcons();
  }

  // Render input path secara dinamis berdasarkan state.images
  function renderPathInputs() {
    dynamicPathContainer.innerHTML = '';

    state.images.forEach((imgState, index) => {
      const numLabel = index + 1;
      let labelText = `Path Gambar ${numLabel}`;
      if (index === 0) labelText += ' (Utama)';
      else if (index === 1) labelText += ' (Detail)';
      else labelText += ' (Opsional)';

      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';
      formGroup.innerHTML = `
        <label for="image-path-${numLabel}">
          <span>${labelText}</span>
          <i data-lucide="help-circle" class="tooltip-trigger" title="Masukkan path lengkap file di komputer Anda"></i>
        </label>
        <div class="input-with-icon">
          <i data-lucide="file-image"></i>
          <input type="text" id="image-path-${numLabel}" value="${imgState.path}" placeholder="Contoh: D:\\produk\\gambar-${numLabel}.jpg">
        </div>
      `;

      const input = formGroup.querySelector('input');
      input.addEventListener('input', () => {
        state.images[index].path = input.value;
        
        // Buat preview mockup jika path terisi tapi file kosong
        if (input.value && !state.images[index].file) {
          state.images[index].name = input.value.split('\\').pop() || input.value;
          state.images[index].previewUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
          
          // Render ulang dropzone tertentu secara cepat tanpa mereset focus
          const dropzone = document.getElementById(`dropzone-${numLabel}`);
          if (dropzone) {
            const content = dropzone.querySelector('.dropzone-content');
            const preview = dropzone.querySelector('.dropzone-preview');
            const previewImg = preview.querySelector('img');
            const filenameTag = preview.querySelector('.filename-tag');
            
            previewImg.src = state.images[index].previewUrl;
            filenameTag.textContent = state.images[index].name;
            content.classList.add('hidden');
            preview.classList.remove('hidden');
          }
        }
        checkValidation();
      });

      dynamicPathContainer.appendChild(formGroup);
    });

    lucide.createIcons();
  }

  // Event handler drag-and-drop per kartu
  function setupDragEventsForCard(card, index) {
    ['dragenter', 'dragover'].forEach(eventName => {
      card.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      card.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.classList.remove('drag-over');
      }, false);
    });

    card.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        if (files.length >= 2) {
          // Jika drag banyak file sekaligus, tangani secara global
          handleMultipleFiles(files);
        } else {
          // Jika hanya 1 file, masukkan ke slot kartu ini
          handleFileSelect(files[0], index);
        }
      }
    });
  }

  // Tangani drop global pada container dropzone
  dropzonesContainer.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dropzonesContainer.classList.add('drag-over');
  });
  dropzonesContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  dropzonesContainer.addEventListener('dragleave', () => {
    dropzonesContainer.classList.remove('drag-over');
  });
  dropzonesContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzonesContainer.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleMultipleFiles(files);
    }
  });

  // ==========================================================================
  // MULTIPLE FILES HANDLING (Opsi B: Sistem Tambah)
  // ==========================================================================
  function handleMultipleFiles(files) {
    // Saring file gambar saja
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      showToast('Tidak ada file gambar yang valid!', 'error');
      return;
    }

    const fileCount = imageFiles.length;
    showToast(`Membaca ${fileCount} gambar...`, 'info');

    // Alokasikan target indeks secara sinkron untuk mencegah race condition
    const targetIndices = [];
    let tempImages = [...state.images];

    imageFiles.forEach(() => {
      let targetIndex = tempImages.findIndex(img => img.previewUrl === null);
      if (targetIndex === -1) {
        // Jika tidak ada slot kosong, buat slot baru di state.images dan tempImages
        state.images.push({ file: null, path: '', previewUrl: null, width: 0, height: 0, name: '' });
        tempImages.push({ file: null, path: '', previewUrl: null, width: 0, height: 0, name: '' });
        targetIndex = state.images.length - 1;
      }
      // Tandai slot sebagai dipesan
      tempImages[targetIndex] = { previewUrl: 'reserved' };
      targetIndices.push(targetIndex);
    });

    // Jalankan pembacaan file berdasarkan target indeks yang telah dialokasikan
    let loadPromises = imageFiles.map((file, i) => {
      const targetIndex = targetIndices[i];
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            state.images[targetIndex] = {
              file: file,
              name: file.name,
              previewUrl: e.target.result,
              width: img.width,
              height: img.height,
              path: state.images[targetIndex].path || `C:\\images\\${file.name}`
            };
            resolve(true);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(loadPromises).then(() => {
      renderUI();
      showToast(`Berhasil menambahkan ${fileCount} gambar ke slot.`, 'success');
      
      // Auto scroll ke akhir kontainer agar user melihat box baru yang ditambahkan
      setTimeout(() => {
        dropzonesContainer.scrollTo({
          top: dropzonesContainer.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    });
  }

  // Membaca file tunggal untuk satu slot
  function handleFileSelect(file, index) {
    if (!file.type.startsWith('image/')) {
      showToast('Hanya file gambar yang didukung!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.images[index] = {
          file: file,
          name: file.name,
          previewUrl: e.target.result,
          width: img.width,
          height: img.height,
          path: state.images[index].path || `C:\\images\\${file.name}`
        };

        renderUI();
        showToast(`Gambar ${index + 1} berhasil dimuat.`, 'success');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Hapus file dari slot
  function removeFile(index) {
    const isDynamicSlot = state.images.length > 2;

    if (isDynamicSlot) {
      // Jika jumlah slot lebih dari 2, kita hapus slot dinamis ini
      state.images.splice(index, 1);
      showToast(`Slot gambar dihapus. Jumlah slot sekarang: ${state.images.length}`, 'info');
    } else {
      // Jika tersisa 2 slot (minimal), kita hanya kosongkan isinya tanpa menghapus box
      state.images[index] = { file: null, path: '', previewUrl: null, width: 0, height: 0, name: '' };
      showToast(`Gambar ${index + 1} dikosongkan.`, 'info');
    }
    
    renderUI();
  }

  // ==========================================================================
  // TAB NAVIGATION SYSTEM
  // ==========================================================================
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      state.activeMode = targetTab;
      
      if (targetTab === 'path-mode') {
        pathInputsGroup.classList.remove('hidden');
        showToast('Mode Path Lokal diaktifkan.', 'info');
      } else {
        pathInputsGroup.classList.add('hidden');
        showToast('Mode Upload File diaktifkan.', 'info');
      }
      
      renderUI();
    });
  });

  // ==========================================================================
  // FORM CONFIGURATION EVENTS
  // ==========================================================================
  const layoutInputs = document.querySelectorAll('input[name="layout"]');
  layoutInputs.forEach(input => {
    input.addEventListener('change', () => {
      state.config.layout = input.value;
      showToast(`Layout diubah ke: ${input.value}`, 'info');
    });
  });

  gapSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    gapValueLabel.textContent = `${val}px`;
    state.config.gap = parseInt(val);
  });

  colorPresets.forEach(preset => {
    preset.addEventListener('click', () => {
      colorPresets.forEach(p => p.classList.remove('active'));
      preset.classList.add('active');
      
      const color = preset.getAttribute('data-color');
      state.config.bgColor = color;
      
      if (color !== 'transparent') {
        bgColorPicker.value = color;
      }
      showToast(`Latar belakang: ${color}`, 'info');
    });
  });

  bgColorPicker.addEventListener('input', (e) => {
    colorPresets.forEach(p => p.classList.remove('active'));
    state.config.bgColor = e.target.value;
  });

  suffixInput.addEventListener('input', (e) => {
    state.config.suffix = e.target.value;
  });

  autoScaleCheck.addEventListener('change', (e) => {
    state.config.autoScale = e.target.checked;
  });

  customTextInput.addEventListener('input', (e) => {
    state.config.customText = e.target.value;
  });

  textColorPicker.addEventListener('input', (e) => {
    state.config.textColor = e.target.value;
  });

  textBgPicker.addEventListener('input', (e) => {
    state.config.textBgColor = e.target.value;
  });


  // Validasi apakah tombol Gabungkan bisa diklik
  function checkValidation() {
    let isValid = false;
    
    // Validasi: Gambar 1 dan Gambar 2 harus terisi (baik file upload atau path lokal)
    if (state.activeMode === 'upload-mode') {
      isValid = state.images[0].file !== null && state.images[1].file !== null;
    } else {
      isValid = state.images[0].path.trim() !== '' && state.images[1].path.trim() !== '';
    }
    
    btnMerge.disabled = !isValid;
  }

  // ==========================================================================
  // IMAGE MERGE ENGINE (CLIENT-SIDE HTML5 CANVAS)
  // ==========================================================================
  btnMerge.addEventListener('click', () => {
    btnMerge.disabled = true;
    btnMerge.innerHTML = '<i class="loader-icon" style="animation: spin 1s linear infinite; display: inline-block;">🔄</i> Memproses...';
    
    setTimeout(() => {
      // Periksa apakah ini mode path tanpa file riil yang diupload
      const isPathMock = state.activeMode === 'path-mode' && (!state.images[0].file || !state.images[1].file);

      if (isPathMock) {
        generateMockPathMerge();
      } else {
        mergeImagesWithCanvas();
      }
      
      btnMerge.disabled = false;
      btnMerge.innerHTML = '<i data-lucide="sparkles"></i> Gabungkan Gambar';
      lucide.createIcons();
    }, 800);
  });

  function mergeImagesWithCanvas() {
    // Saring hanya gambar yang memiliki previewUrl
    const activeImageStates = state.images.filter(img => img.previewUrl !== null);
    
    const imageElements = [];
    let loadedCount = 0;

    const onAllLoaded = () => {
      loadedCount++;
      if (loadedCount === activeImageStates.length) {
        performCanvasMerge(imageElements);
      }
    };

    activeImageStates.forEach((imgState, i) => {
      const img = new Image();
      img.onload = onAllLoaded;
      img.src = imgState.previewUrl;
      imageElements.push({ img, index: i });
    });
  }

  function performCanvasMerge(imageElements) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const gap = state.config.gap;
    const autoScale = state.config.autoScale;
    const layout = state.config.layout;
    const N = imageElements.length;
    
    const img1 = imageElements[0].img;
    let canvasW = 0;
    let canvasH = 0;
    
    // Menghitung ukuran dimensi render untuk setiap gambar
    const renderDimensions = [];

    // Gambar 1 adalah jangkar utama
    renderDimensions.push({ w: img1.width, h: img1.height });

    for (let i = 1; i < N; i++) {
      const img = imageElements[i].img;
      let drawW = img.width;
      let drawH = img.height;

      if (autoScale) {
        if (layout === 'horizontal') {
          // Samakan tinggi dengan gambar pertama
          drawH = img1.height;
          drawW = img.width * (img1.height / img.height);
        } else if (layout === 'vertical') {
          // Samakan lebar dengan gambar pertama
          drawW = img1.width;
          drawH = img.height * (img1.width / img.width);
        }
      }
      renderDimensions.push({ w: drawW, h: drawH });
    }

    // Hitung ukuran canvas berdasarkan tata letak
    if (layout === 'horizontal') {
      canvasW = renderDimensions.reduce((sum, dim) => sum + dim.w, 0) + gap * (N - 1);
      canvasH = Math.max(...renderDimensions.map(dim => dim.h));
    } else if (layout === 'vertical') {
      canvasW = Math.max(...renderDimensions.map(dim => dim.w));
      canvasH = renderDimensions.reduce((sum, dim) => sum + dim.h, 0) + gap * (N - 1);
    } else if (layout === 'overlay') {
      // Overlay PIP (Gambar 1 background, gambar lainnya sebagai badge kecil di bawah)
      canvasW = img1.width;
      canvasH = img1.height;
      
      // Hitung ukuran overlay untuk gambar 2..N
      // Setiap gambar overlay lebarnya 18% dari lebar background
      const overlayW = canvasW * 0.18;
      for (let i = 1; i < N; i++) {
        const img = imageElements[i].img;
        const overlayH = img.height * (overlayW / img.width);
        renderDimensions[i] = { w: overlayW, h: overlayH };
      }
    }

    // Hitung area tambahan untuk teks kustom (jika ada)
    const hasCustomText = state.config.customText && state.config.customText.trim() !== '';
    let textAreaHeight = 0;
    const textPadding = 20;
    let fontSize = 0;

    if (hasCustomText) {
      // Tentukan ukuran font berdasarkan lebar canvas (responsive)
      fontSize = Math.max(Math.floor(canvasW * 0.04), 24); // Min 24px
      fontSize = Math.min(fontSize, 80); // Max 80px
      textAreaHeight = fontSize + (textPadding * 2);
      canvasH += textAreaHeight;
    }

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Gambar background warna
    ctx.clearRect(0, 0, canvasW, canvasH);
    if (state.config.bgColor !== 'transparent') {
      ctx.fillStyle = state.config.bgColor;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // Render masing-masing gambar ke canvas
    if (layout === 'horizontal') {
      let currentX = 0;
      imageElements.forEach((el, i) => {
        const { w, h } = renderDimensions[i];
        const yOffset = (canvasH - textAreaHeight - h) / 2; // Rata tengah vertikal (minus text area)
        ctx.drawImage(el.img, currentX, yOffset, w, h);
        currentX += w + gap;
      });
    } else if (layout === 'vertical') {
      let currentY = 0;
      imageElements.forEach((el, i) => {
        const { w, h } = renderDimensions[i];
        const xOffset = (canvasW - w) / 2; // Rata tengah horizontal
        ctx.drawImage(el.img, xOffset, currentY, w, h);
        currentY += h + gap;
      });
    } else if (layout === 'overlay') {
      // Gambar background utama
      ctx.drawImage(img1, 0, 0, img1.width, img1.height);
      
      // Letakkan overlays (Gambar 2..N) berjejer di pojok kanan bawah mengalir ke kiri
      let currentRightOffset = gap;
      for (let i = 1; i < N; i++) {
        const { w, h } = renderDimensions[i];
        const xPos = canvasW - w - currentRightOffset;
        const yPos = canvasH - textAreaHeight - h - gap; // Adjusted for text area
        
        // Gambar border tipis di sekitar overlay agar tampak terpisah
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(xPos - 2, yPos - 2, w + 4, h + 4);
        
        ctx.drawImage(imageElements[i].img, xPos, yPos, w, h);
        currentRightOffset += w + gap;
      }
    }

    // Gambar teks kustom di bagian bawah (jika ada)
    if (hasCustomText) {
      const textY = canvasH - textAreaHeight;
      
      // Gambar background untuk area teks
      ctx.fillStyle = state.config.textBgColor;
      ctx.fillRect(0, textY, canvasW, textAreaHeight);
      
      // Gambar teks
      ctx.fillStyle = state.config.textColor;
      ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Shadow untuk keterbacaan
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillText(state.config.customText, canvasW / 2, textY + (textAreaHeight / 2));
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }


    // Ambil hasil penggabungan dalam format Data URL (base64)
    const resultDataUrl = canvas.toDataURL('image/png');
    mergedOutputImg.src = resultDataUrl;
    
    // Tampilkan panel hasil
    resultBox.classList.remove('hidden');
    
    // Sesuaikan antarmuka berdasarkan mode aktif
    if (state.activeMode === 'path-mode') {
      outputPathIndicator.classList.remove('hidden');
      const baseDir = state.images[0].path.substring(0, state.images[0].path.lastIndexOf('\\') + 1) || 'C:\\images\\';
      const origName = state.images[0].name.substring(0, state.images[0].name.lastIndexOf('.')) || 'produk';
      const ext = state.images[0].name.split('.').pop() || 'png';
      savedPathText.textContent = `${baseDir}${origName}${state.config.suffix}.${ext}`;
      showToast('Gambar berhasil digabungkan dan disimpan secara virtual ke folder asal PC Anda!', 'success');
    } else {
      outputPathIndicator.classList.add('hidden');
      showToast('Gambar berhasil digabungkan! Silakan download hasilnya.', 'success');
    }

    // Tombol unduhan
    btnDownload.onclick = () => {
      const link = document.createElement('a');
      const origName = state.images[0].name.substring(0, state.images[0].name.lastIndexOf('.')) || 'merged_image';
      link.download = `${origName}${state.config.suffix}.png`;
      link.href = resultDataUrl;
      link.click();
    };

    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Kasus simulasi local path PC
  function generateMockPathMerge() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 150 + state.images.length * 40;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 800, canvas.height);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(1, '#311042');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, canvas.height);
    
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Simulasi File Tergabung (Path Lokal)', 400, 70);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    
    state.images.forEach((img, i) => {
      if (img.path) {
        ctx.fillText(`Gambar ${i+1}: ${img.path}`, 400, 130 + i * 35);
      }
    });
    
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✓ File Tersimpan di Drive Anda', 400, canvas.height - 40);

    const resultDataUrl = canvas.toDataURL('image/png');
    mergedOutputImg.src = resultDataUrl;
    
    resultBox.classList.remove('hidden');
    outputPathIndicator.classList.remove('hidden');
    
    const baseDir = state.images[0].path.substring(0, state.images[0].path.lastIndexOf('\\') + 1) || 'C:\\images\\';
    const filename = state.images[0].path.split('\\').pop() || 'image1.jpg';
    const origName = filename.substring(0, filename.lastIndexOf('.')) || 'image1';
    const ext = filename.split('.').pop() || 'jpg';
    
    savedPathText.textContent = `${baseDir}${origName}${state.config.suffix}.${ext}`;
    
    showToast('Simulasi Penggabungan Sukses!', 'success');
  }

  // ==========================================================================
  // TOAST SYSTEM (Notifikasi)
  // ==========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    
    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3500);
  }
});
