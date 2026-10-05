# ============================================
# SadTalker OFFICIEL - Guide de démarrage
#
# LIENS OFFICIELS :
#   Github  : https://github.com/OpenTalker/SadTalker
#   Colab   : https://colab.research.google.com/github/Winfredy/SadTalker/blob/main/quick_demo.ipynb
#   Démo HF : https://huggingface.co/spaces/vinthony/SadTalker
#   Install : https://sadtalker.ai/install
#
# IMPORTANT : le notebook qui marche est
#   colab-scripts/SadTalker_API.ipynb
#   (il utilise la CLI officielle inference.py, PAS src.generate)
# ============================================

echo "============================================================"
echo "  SadTalker - Installation LOCALE officielle"
echo "  (alternative au Colab si vous voulez du 100% local)"
echo "============================================================"

# ============================================
# OPTION A - Installation locale (Windows/Linux)
# Source : README officiel du repo GitHub
# ============================================
LOCAL_INSTALL=$(cat <<'EOF'

  # 1. Prérequis : Git + Python 3.10.x + FFmpeg + GPU NVIDIA recommandé
  git clone https://github.com/OpenTalker/SadTalker.git
  cd SadTalker

  # 2. Environnement Python
  # (avec conda, recommandé par les auteurs)
  conda create -n sadtalker python=3.10
  conda activate sadtalker

  # 3. Dépendances
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
  pip install -r requirements.txt

  # 4. FFmpeg (obligatoire pour l'encodage vidéo)
  #   Windows : https://ffmpeg.org/download.html + ajouter au PATH
  #   Linux   : sudo apt install ffmpeg
  #   macOS   : brew install ffmpeg

  # 5. Modèles pré-entraînés (GPU : ~2 Go RAM)
  bash scripts/download_models.sh

  # 6. Lancer l'interface Gradio (port 7860)
  python app.py
  #   → ouvrez http://127.0.0.1:7860 dans votre navigateur

EOF
)
echo "$LOCAL_INSTALL"

echo ""
echo "============================================================"
echo "  Génération via la CLI OFFICIELLE (inference.py)"
echo "============================================================"
CLI=$(cat <<'EOF'

  # Depuis le dossier SadTalker :
  python inference.py \
    --driven_audio ./examples/driven_audio/bus_chinese.wav \
    --source_image  ./examples/source_image/full_body_2.png \
    --result_dir    ./results \
    --still \
    --preprocess crop \
    --enhancer gfpgan \
    --size 256

  # la vidéo est créée dans ./results/
EOF
)
echo "$CLI"

echo ""
echo "============================================================"
echo "  API Flask (port 5000) + tunnel ngrok"
echo "  => Utilisez le notebook colab-scripts/SadTalker_API.ipynb"
echo "============================================================"
echo "
  Ce notebook :
    1. Clone le repo officiel
    2. Installe les dépendances (pinned par les auteurs)
    3. Télécharge les modèles (scripts/download_models.sh)
    4. Démarre Flask qui appelle la CLI inference.py
    5. Expose le tout via ngrok

  Récupérez l'URL affichée et mettez-la dans .env :
    SADTALKER_API_URL=https://xxxx.ngrok-free.app
"