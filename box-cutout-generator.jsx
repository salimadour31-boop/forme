Passer au contenu principal
Ctrl+J

Créer un bot




Bibliothèque

Tous

Médias

Projets

Applications

Fichiers
Aujourd'hui


Generateur_Maquettes_Packaging.jsx
Il y a 3m · 11 KB


fefco_0201_corrected.svg
Il y a 6m · 3 KB


PACKAGING_STUDIO_v4_1_CORRIGE.jsx
Il y a 9m · 15 KB


PACKAGING_STUDIO_v4_1_CORRIGE.jsx
Il y a 11m · 15 KB

Application web de génération d'images IA haute résolution
Il y a 2h
Hier

Création d'application web IA génération d'images haute résolution
Il y a 1d
Plus tôt

Création d'application web IA générative d'images haute résolution
Il y a 3d

Création d'application web IA génération d'images haute résolution
Il y a 3d

generated_video.mp4
Il y a 3d · 1 MB

Création d'application web IA générative d'images haute résolution
Il y a 4d

Création d'application web IA génération d'images haute résolution
21 oct.

New conversation
19 oct.

generated_video.mp4
19 oct. · 57 MB

generated_video.mp4
19 oct. · 57 MB


image.png
19 oct. · 5 MB

generated_video.mp4
19 oct. · 27 MB

generated_video.mp4
19 oct. · 27 MB

generated_video.mp4
19 oct. · 27 MB
Échec du chargement de plus
Aperçu du fichier : Generateur_Maquettes_Packaging.jsx
/*
 * Generateur Maquettes Packaging - Inspiré de Pacdora
 * Script Adobe Illustrator (JSX / ExtendScript)
 * 
 * Inspiré des maquettes populaires de https://www.pacdora.com/fr/mockups
 * (boîtes, sachets, canettes, bouteilles, etc.)
 * 
 * Fonctions :
 * - Génération de dieline pour boîte rectangulaire (coupe + plis)
 * - Formes de base pour canette, sachet, boîte simple
 * - Couleurs standard packaging (coupe rouge, pli magenta)
 * 
 * Installation :
 * 1. Enregistrer ce fichier en .jsx
 * 2. Dans Illustrator : Fichier → Scripts → Autre script... → choisir le fichier
 *    Ou placer dans le dossier Scripts d'Illustrator pour l'avoir dans le menu.
 * 
 * Auteur : Script généré pour usage packaging / maquettes
 */

#target illustrator

(function() {
    if (app.documents.length === 0) {
        alert("Ouvrez un document Illustrator avant de lancer le script.");
        return;
    }

    var doc = app.activeDocument;
    var layer = getOrCreateLayer("Maquettes Packaging");

    // --- Dialog ---
    var win = new Window("dialog", "Générateur de Maquettes (style Pacdora)");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 16;

    win.add("statictext", undefined, "Choisissez un type de maquette / gabarit :");

    var typeGroup = win.add("group");
    typeGroup.orientation = "column";
    typeGroup.alignChildren = ["left", "top"];

    var types = [
        "Boîte rectangulaire (Dieline complète)",
        "Boîte simple (rectangle + flaps basiques)",
        "Canette / Bouteille (cylindre 2D)",
        "Sachet / Pouch (forme stand-up)",
        "Livre / Magazine (couverture + dos)",
        "T-shirt (silhouette simple)"
    ];

    var typeDropdown = typeGroup.add("dropdownlist", undefined, types);
    typeDropdown.selection = 0;

    // Dimensions
    var dimPanel = win.add("panel", undefined, "Dimensions (en mm)");
    dimPanel.orientation = "column";
    dimPanel.alignChildren = ["fill", "top"];
    dimPanel.margins = 12;

    function addDimField(parent, label, defaultVal) {
        var g = parent.add("group");
        g.add("statictext", undefined, label + " :");
        var et = g.add("edittext", undefined, defaultVal);
        et.characters = 8;
        return et;
    }

    var widthField = addDimField(dimPanel, "Largeur (W)", "100");
    var heightField = addDimField(dimPanel, "Hauteur (H)", "150");
    var depthField = addDimField(dimPanel, "Profondeur (D)", "50");

    var optGroup = win.add("group");
    var dashedFolds = optGroup.add("checkbox", undefined, "Plis en pointillés (magenta)");
    dashedFolds.value = true;
    var addBleed = optGroup.add("checkbox", undefined, "Ajouter fond perdu 3 mm");
    addBleed.value = false;

    var btnGroup = win.add("group");
    btnGroup.alignment = "right";
    var cancelBtn = btnGroup.add("button", undefined, "Annuler", {name: "cancel"});
    var okBtn = btnGroup.add("button", undefined, "Générer", {name: "ok"});

    okBtn.onClick = function() {
        var typeIndex = typeDropdown.selection.index;
        var w = parseFloat(widthField.text) || 100;
        var h = parseFloat(heightField.text) || 150;
        var d = parseFloat(depthField.text) || 50;

        // Conversion mm → points
        var mmToPt = 2.834645669;
        w *= mmToPt;
        h *= mmToPt;
        d *= mmToPt;

        try {
            switch (typeIndex) {
                case 0: createBoxDieline(w, h, d, dashedFolds.value, addBleed.value); break;
                case 1: createSimpleBox(w, h, d); break;
                case 2: createCan(w, h); break;
                case 3: createPouch(w, h); break;
                case 4: createBook(w, h, d); break;
                case 5: createTshirt(w, h); break;
            }
            win.close(1);
        } catch (e) {
            alert("Erreur : " + e.message);
        }
    };

    cancelBtn.onClick = function() { win.close(0); };

    if (win.show() === 1) {
        alert("Maquettes générées sur le calque « Maquettes Packaging ».");
    }

    // ========== FONCTIONS DE DESSIN ==========

    function getOrCreateLayer(name) {
        try {
            return doc.layers.getByName(name);
        } catch (e) {
            var l = doc.layers.add();
            l.name = name;
            return l;
        }
    }

    function createPath(points, strokeColor, dashed) {
        var path = layer.pathItems.add();
        path.setEntirePath(points);
        path.stroked = true;
        path.filled = false;
        path.strokeWidth = 0.5;
        path.strokeColor = strokeColor;
        if (dashed) {
            path.strokeDashes = [4, 2];
        }
        return path;
    }

    function makeColor(c, m, y, k) {
        var col = new CMYKColor();
        col.cyan = c; col.magenta = m; col.yellow = y; col.black = k;
        return col;
    }

    var cutColor = makeColor(0, 100, 100, 0);   // Rouge (coupe)
    var foldColor = makeColor(0, 100, 0, 0);    // Magenta (pli)

    // --- Boîte dieline complète (style mailer / RSC simplifié) ---
    function createBoxDieline(w, h, d, dashed, bleed) {
        var group = layer.groupItems.add();
        group.name = "Dieline Boîte " + Math.round(w/2.834) + "x" + Math.round(h/2.834) + "x" + Math.round(d/2.834);

        var flapH = d * 0.5;
        var glue = 12 * 2.834645669; // ~12 mm glue flap

        var x = 50;
        var y = 400;

        // Ordre : glue | side | front | side | back
        var panels = [glue, d, w, d, w];
        var currentX = x;

        // Lignes horizontales principales (bas et haut des panneaux)
        var topY = y + h;
        var bottomY = y;

        for (var i = 0; i < panels.length; i++) {
            var pw = panels[i];
            // Panneau principal
            var pts = [
                [currentX, bottomY],
                [currentX + pw, bottomY],
                [currentX + pw, topY],
                [currentX, topY]
            ];
            var p = createPath(pts, cutColor, false);
            p.move(group, ElementPlacement.PLACEATEND);

            // Flaps haut et bas (sauf glue)
            if (i > 0 && i < panels.length - 1) {
                // Flap haut
                var topFlap = createPath([
                    [currentX, topY],
                    [currentX + pw, topY],
                    [currentX + pw, topY + flapH],
                    [currentX, topY + flapH]
                ], cutColor, false);
                topFlap.move(group, ElementPlacement.PLACEATEND);

                // Flap bas
                var botFlap = createPath([
                    [currentX, bottomY],
                    [currentX + pw, bottomY],
                    [currentX + pw, bottomY - flapH],
                    [currentX, bottomY - flapH]
                ], cutColor, false);
                botFlap.move(group, ElementPlacement.PLACEATEND);
            }

            // Lignes de pli verticales
            if (i > 0) {
                var fold = createPath([
                    [currentX, bottomY - flapH],
                    [currentX, topY + flapH]
                ], foldColor, dashed);
                fold.move(group, ElementPlacement.PLACEATEND);
            }

            currentX += pw;
        }

        // Lignes de pli horizontales (top/bottom flaps)
        var foldTop = createPath([
            [x + glue, topY],
            [currentX, topY]
        ], foldColor, dashed);
        foldTop.move(group, ElementPlacement.PLACEATEND);

        var foldBot = createPath([
            [x + glue, bottomY],
            [currentX, bottomY]
        ], foldColor, dashed);
        foldBot.move(group, ElementPlacement.PLACEATEND);

        // Texte dimensions
        var tf = group.textFrames.add();
        tf.contents = "Boîte " + Math.round(w/2.834) + " × " + Math.round(h/2.834) + " × " + Math.round(d/2.834) + " mm\nLignes rouges = coupe | Magenta = pli";
        tf.position = [x, bottomY - flapH - 40];
        tf.textRange.characterAttributes.size = 10;
    }

    // --- Formes simples ---
    function createSimpleBox(w, h, d) {
        var group = layer.groupItems.add();
        group.name = "Boîte simple";
        var r = group.pathItems.rectangle(300, 100, w, h);
        r.stroked = true; r.filled = false; r.strokeColor = cutColor; r.strokeWidth = 1;
        var label = group.textFrames.add();
        label.contents = "Boîte " + Math.round(w/2.834) + "×" + Math.round(h/2.834) + "×" + Math.round(d/2.834) + " mm";
        label.position = [100, 280];
    }

    function createCan(w, h) {
        var group = layer.groupItems.add();
        group.name = "Canette";
        // Corps
        var body = group.pathItems.rectangle(350, 150, w, h * 0.8);
        body.stroked = true; body.filled = false; body.strokeColor = cutColor;
        // Top ellipse
        var top = group.pathItems.ellipse(350 + h*0.1, 150, w, h*0.2);
        top.stroked = true; top.filled = false; top.strokeColor = cutColor;
        var label = group.textFrames.add();
        label.contents = "Canette / Bouteille " + Math.round(w/2.834) + "×" + Math.round(h/2.834) + " mm";
        label.position = [150, 300];
    }

    function createPouch(w, h) {
        var group = layer.groupItems.add();
        group.name = "Sachet";
        var pts = [
            [150, 200],
            [150 + w*0.15, 200 + h],
            [150 + w*0.85, 200 + h],
            [150 + w, 200],
            [150 + w*0.85, 200 - 20],
            [150 + w*0.15, 200 - 20]
        ];
        var p = createPath(pts, cutColor, false);
        p.closed = true;
        p.move(group, ElementPlacement.PLACEATEND);
        var label = group.textFrames.add();
        label.contents = "Sachet / Pouch " + Math.round(w/2.834) + "×" + Math.round(h/2.834) + " mm";
        label.position = [150, 170];
    }

    function createBook(w, h, d) {
        var group = layer.groupItems.add();
        group.name = "Livre";
        var cover = group.pathItems.rectangle(400, 100, w, h);
        cover.stroked = true; cover.filled = false; cover.strokeColor = cutColor;
        var spine = group.pathItems.rectangle(400, 100 - d, d, h);
        spine.stroked = true; spine.filled = false; spine.strokeColor = foldColor;
        var label = group.textFrames.add();
        label.contents = "Livre / Magazine\nCouverture " + Math.round(w/2.834) + "×" + Math.round(h/2.834) + " + dos " + Math.round(d/2.834) + " mm";
        label.position = [100, 370];
    }

    function createTshirt(w, h) {
        var group = layer.groupItems.add();
        group.name = "T-shirt";
        // Corps
        var body = group.pathItems.rectangle(300, 200, w, h);
        body.stroked = true; body.filled = false; body.strokeColor = cutColor;
        // Manches
        var sleeveW = w * 0.35;
        var sleeveH = h * 0.3;
        var leftSleeve = group.pathItems.rectangle(300 + h*0.1, 200 - sleeveW*0.3, sleeveW, sleeveH);
        leftSleeve.stroked = true; leftSleeve.filled = false; leftSleeve.strokeColor = cutColor;
        var rightSleeve = group.pathItems.rectangle(300 + h*0.1, 200 + w - sleeveW*0.7, sleeveW, sleeveH);
        rightSleeve.stroked = true; rightSleeve.filled = false; rightSleeve.strokeColor = cutColor;
        var label = group.textFrames.add();
        label.contents = "T-shirt " + Math.round(w/2.834) + "×" + Math.round(h/2.834) + " mm";
        label.position = [200, 270];
    }

})();
Bibliothèque - Grok
