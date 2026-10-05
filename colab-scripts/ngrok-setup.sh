#!/usr/bin/env bash
# ============================================
# Configuration ngrok pour exposer SadTalker
# Ce script installe ngrok et configure le tunnel
# vers un serveur local de SadTalker
#
# USAGE :
#   chmod +x ngrok-setup.sh
#   ./ngrok-setup.sh VOTRE_TOKEN_NGROK
# ============================================

set -e

# Vérifie que le token est fourni
if [ -z "$1" ]; then
  echo "Erreur : veuillez fournir votre token ngrok"
  echo "Usage : ./ngrok-setup.sh VOTRE_TOKEN_NGROK"
  echo "Obtenez un token gratuit : https://dashboard.ngrok.com"
  exit 1
fi

TOKEN="$1"
echo "=============================================="
echo "  Configuration ngrok"
echo "  Token : $TOKEN"
echo "=============================================="

# Vérifie l'environnement (Linux/Colab ou Windows)
if command -v ngrok &> /dev/null; then
  echo "[OK] ngrok déjà installé"
else
  echo "[INFO] Installation de ngrok..."
  # Télécharge ngrok (version Linux - pour Colab)
  if [[ "$(uname -s)" == "Linux" ]]; then
    wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz -O /tmp/ngrok.tgz
    tar -xzf /tmp/ngrok.tgz -C /tmp
    sudo mv /tmp/ngrok /usr/local/bin/
    echo "[OK] ngrok installé"
  else
    echo "[INFO] Sur Windows, téléchargez ngrok depuis https://ngrok.com/download"
  fi
fi

# Configure le token d'authentification
ngrok config add-authtoken "$TOKEN"
echo "[OK] Token configuré"

echo "=============================================="
echo "  Pour créer le tunnel, exécutez :"
echo ""
echo "  Sur Colab (avec pyngrok) :"
echo "    pip install pyngrok"
echo "    from pyngrok import ngrok"
echo "    url = ngrok.connect(5000)   # SadTalker sur port 5000"
echo "    print(url)"
echo ""
echo "  En local sur Windows :"
echo "    ngrok http 5000"
echo ""
echo "  Puis copiez l'URL https://xxxx.ngrok-free.app"
echo "  dans votre fichier .env comme SADTALKER_API_URL"
echo "=============================================="
