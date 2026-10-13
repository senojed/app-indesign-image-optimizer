# InDesign Image Optimizer pro Windows

[English documentation](README.md). Anglické rozhraní: spusťte InDesignImageOptimizer.en.jsx; české: InDesignImageOptimizer.jsx.

Lokální ExtendScript pro dávkové převody propojených rastrů na PSD přes Photoshop a BridgeTalk. Bez knihoven, Photoshop Actions nejsou nutné pro změnu rozlišení.

**Stav:** implementováno; konkrétní výsledky ověření jsou v [docs/TESTING.md](docs/TESTING.md). Před ostrou zakázkou spusťte na její kopii a vizuálně porovnejte exporty. Není to univerzální náhrada LinkOptimizeru.

## Instalace

1. V InDesignu otevřete **Window → Utilities → Scripts**.
2. V kontextové nabídce **User** zvolte **Reveal in Explorer**.
3. Do Scripts Panel zkopírujte celou složku projektu, minimálně `InDesignImageOptimizer.jsx` a složku `lib` se všemi čtyřmi `.jsxinc` soubory. Zachovejte vzájemné cesty.
4. Spusťte Photoshop. V **Edit → Color Settings** musí být politiky RGB, CMYK i Gray nastavené na **Preserve Embedded Profiles**. Skript nic nepřepíná automaticky; neznámou politiku odmítne.
5. Otevřete a uložte INDD. Dvojklikem spusťte `InDesignImageOptimizer.jsx` v panelu Scripts.

Podporováno je Windows + ExtendScript. UXP skript ani plugin se neinstaluje. Skript sám nikam neposílá obrázky; ukládá je vedle INDD. Pokud složku synchronizuje Nextcloud nebo jiná služba, nadále platí nastavení této služby.

## Použití

- Zadejte maximální efektivní PPI (výchozí 430) a celý dokument nebo vybrané obrázky/rámečky/skupiny.
- Výchozí volba je **Bez akce**. Tlačítko **Načíst sady z Photoshopu** naplní dva seznamy. Případně přepněte na ruční zadání přesných názvů.
- Při použití akce zavřete ostatní dokumenty Photoshopu. Používejte pouze osobně ověřenou akci bez ukládání, otevírání, zavírání a externích skriptů. Action není bezpečnostně izolovaná a může měnit soubory mimo pracovní kopii. Zaškrtnutí v UI potvrzuje, že toto omezení znáte.
- Klikněte na **Náhled**. U každého výskytu uvidíte obě PPI, plánované PPI před zaokrouhlením na pixely, jméno PSD a plán zálohy/relinku. Změna nastavení zneplatní náhled.
- Klikněte na **Start**. Během dávky dokument ani zdrojové obrázky neupravujte. Rušení se uplatní v bezpečném bodě; právě běžící Photoshop příkaz nelze násilně zastavit.
- Výsledek zkontrolujte a **uložte INDD**. Bez potvrzeného mazání skript pracovní INDD automaticky neukládá. Úspěšné položky při zrušení zůstávají přelinkované; další se nespustí.

Všechny způsobilé rastry se převedou na samostatné PSD, i když nepotřebují downscale. Při PPI pod limitem se pixely nezvětšují. Pro nestejné PPI platí vyšší osa: např. 600×400 PPI při limitu 300 dává přibližně 300×200 PPI. Fyzická geometrie se zachová kompenzační maticí; číselná procenta měřítka se přirozeně změní. Podrobnosti a neslučitelné požadavky vysvětluje [architektura](docs/ARCHITECTURE.md).

## Výstupy a zálohy

```text
zakazka.indd
Links/
  fotografie_001.psd
  fotografie_001.psd.iio
  fotografie_002.psd
  fotografie_002.psd.iio
backup/
  iio-<identifikátor běhu>/
    document-before.indd
    source-001/původní-soubor.jpg
    work-001/...
    journal.jsonl
    report.json
```

- Jeden zdroj má v daném běhu jednu zálohu; stejná jména z různých adresářů dostanou různá `source-NNN` umístění. Celý obsah kopie se porovnává po binárních blocích.
- Každý výskyt má vlastní PSD. Číslování hledá první volné jméno; existující PSD ani marker se nepřepisuje.
- `.iio` a štítek objektu brání opětovnému zpracování. Markery nemažte, pokud chcete tuto ochranu zachovat.
- Pracovní kopie a ověřovací kopie PSD zůstávají v `backup`, takže běh vyžaduje dostatek volného místa. Automatické odstraňování pracovních dat není součástí této verze.
- `document-before.indd` obsahuje stav včetně neuložených úprav na začátku běhu. Odkazy v něm stále míří na původní cesty. Po smazání originálů je při obnově nejprve vraťte ze záloh podle journalu.
- Report obsahuje plné místní cesty. Před sdílením zkontrolujte případné důvěrné názvy zakázek.

## Mazání originálů

Výchozí stav je **ponechat všechny originály**. Volba v hlavním dialogu pouze nabídne další potvrzení po dokončení.

Mazání je dostupné pouze po kompletní úspěšné dávce. Skript znovu porovná zálohy i výsledná PSD, zkontroluje úspěšné výskyty, odkazy aktivního dokumentu i odkazy ostatních otevřených INDD. Kandidáty zobrazí s plnými cestami. Potvrzení nejprve uloží aktuální INDD a následně odstraní soubory.

Nelze zjistit použití v zavřených dokumentech. Potvrzujte pouze soubory, jejichž další využití jste ověřili. Externí soubory, vektory, neúplně zpracované zdroje a zdroje stále použité mimo výběr se nemažou. NTFS junctions/synchronizační přesměrování a souběžné zásahy jiných programů nejsou transakčně izolované; v takovém prostředí ponechte mazání vypnuté.

## Zotavení po chybě

- Běžná chyba položky: zdroj zůstává, obnoví se původní odkaz a transformace a kontroluje se obnovená geometrie. Ostatní položky mohou pokračovat. Selhání akce, rollbacku nebo neznámý stav komunikace dávku zastaví.
- Timeout/ukončení aplikace: pracovní soubory se ponechají. Složka `.iio-active` chrání projekt před novým během, dokud není jasný stav Photoshopu.
- Neodstraňujte zámek, dokud Photoshop může dokončovat původní operaci. Zrušte případný dialog/akci ve Photoshopu, zkontrolujte jeho pracovní dokumenty a journal. Nejjednodušší spolehlivé ukončení nejistého workeru je ukončit Photoshop po bezpečném uložení vlastních dokumentů.
- Potom zkontrolujte INDD, případně použijte `document-before.indd` a zálohy zdrojů. Až poté ručně odstraňte `.iio-active`. Skript neopakuje přerušenou položku automaticky.
- Při chybě rollbacku **neukládejte změněný pracovní dokument přes jedinou původní kopii**; použijte kopii před během. Report jasně označí tuto situaci.
- Zbytky `.iio-*.psd` a PSD neúspěšné položky jsou záměrně ponechané; jejich odstranění po kontrole je ruční.

## Omezení

- Povolené přípony: PSD, PSB, TIFF, JPEG, PNG, BMP, GIF, TGA. Vždy musí jít také o InDesign `Image`. Podpora konkrétního barevného režimu/bitové hloubky závisí na Photoshop PSD; nepodporovaný převod selže bez relinku. RAW, HEIC a neznámé formáty se přeskočí.
- Vložené, chybějící a zastaralé odkazy se přeskočí. Skript je automaticky neaktualizuje.
- Ukotvené obrázky, zamčené objekty/rodiče/vrstvy, obtékání textu, ořezové cesty a lokální přepisy viditelnosti PSD vrstev se přeskočí. Běžný výřez rámečkem a alfa průhlednost podporovány jsou.
- Akce nesmí změnit rozměry, rozlišení ani identitu dokumentu. Její interní ořez/rotaci/přemalování při stejných výsledných rozměrech nelze obecně odhalit; použijte ji jen pro záměrné úpravy, například CMYK.
- Skript nikdy nevolá flatten. Uživatelská akce ale může vrstvy sloučit; taková akce je rozhodnutí uživatele.
- Nepřepíná PSD Maximize Compatibility ani barevné preference Photoshopu. Dialogy konkrétních akcí nebo pluginů mohou navzdory `DialogModes.NO` vyžadovat zásah. Timeout není záruka ukončení takového dialogu.
- Kontrola geometrie 0,01 pt neověřuje pixelovou shodu renderu. Photoshop může při resamplingu vykreslit živé textové vrstvy, Smart Objects nebo efekty jinak. Před tiskem porovnejte výstupní PDF.
- Přerušením napájení nebo pádem procesu nelze zajistit úplnou atomickou transakci mezi Photoshopem, InDesignem a diskem. Síťové/synchronizované disky přidávají další riziko souběhu.

## Vývoj a testování

```powershell
node tests/core.test.cjs
node tests/worker.test.cjs
node tests/ui.test.cjs
powershell -ExecutionPolicy Bypass -File tests/run-adobe.ps1
powershell -ExecutionPolicy Bypass -File tests/run-adobe.ps1 -Script adobe-safety.jsx
```

Node slouží jen vývojovým testům; pro použití skriptu není potřebný. Adobe test vytvoří vlastní soubory pod `tests/artifacts`, otevře nový INDD, zpracuje jej a zavře. Stávající dokumenty nemění. Test spouštějte v době, kdy v aplikacích nejsou blokující dialogy.

Technické zdroje: [API.md](docs/API.md). Testovací matice a stav ověření: [TESTING.md](docs/TESTING.md).

Při zrušení během čekání na Photoshop skript čeká na potvrzení nejvýše dalších 10 sekund. Bez potvrzení vrátí report s nejistým stavem a ponechá `.iio-active`; Photoshop může dál dokončovat operaci. Tento limit se nevztahuje na synchronní kopírování souborů ani příkaz InDesignu. Dokončení workeru lze potvrdit také jeho souborem `done.json`, i když se ztratí odpověď BridgeTalk. Postup zotavení výše platí i pro tento případ.

Při spuštění se sady a akce automaticky načtou, pokud Photoshop již běží. Na automatickou odpověď se čeká nejvýše 5 sekund. Při neúspěchu lze použít tlačítko Načíst sady z Photoshopu nebo zadat názvy ručně. Samotné načtení nezapíná provedení akce; vyberte režim Vybrat ze seznamu a požadovanou sadu/akci.
