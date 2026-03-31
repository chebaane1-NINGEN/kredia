package com.kredia.service;

import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.entity.credit.KycLoan;
import com.kredia.enums.EcheanceStatus;
import com.kredia.enums.KycStatus;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.EcheanceRepository;
import com.kredia.repository.KycLoanRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.axis.NumberAxis;
import org.jfree.chart.labels.StandardCategoryItemLabelGenerator;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.data.general.DefaultPieDataset;
import org.jfree.data.category.DefaultCategoryDataset;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class StatisticsPdfExportService {

    private final CreditRepository creditRepository;
    private final EcheanceRepository echeanceRepository;
    private final KycLoanRepository kycLoanRepository;

    @Autowired
    public StatisticsPdfExportService(CreditRepository creditRepository, EcheanceRepository echeanceRepository,
            KycLoanRepository kycLoanRepository) {
        this.creditRepository = creditRepository;
        this.echeanceRepository = echeanceRepository;
        this.kycLoanRepository = kycLoanRepository;
    }

    public byte[] generateStatisticsPdf(Long creditId) throws IOException {
        Credit credit = creditRepository.findById(creditId)
                .orElseThrow(() -> new RuntimeException("Credit not found for id: " + creditId));

        List<Echeance> echeances = echeanceRepository.findByCreditCreditId(creditId);
        List<KycLoan> kycLoans = kycLoanRepository.findByCreditCreditId(creditId);

        Map<EcheanceStatus, Long> echeancesByStatus = echeances.stream()
                .collect(Collectors.groupingBy(Echeance::getStatus, Collectors.counting()));

        Map<KycStatus, Long> kycLoansByStatus = kycLoans.stream()
                .collect(Collectors.groupingBy(KycLoan::getVerifiedStatus, Collectors.counting()));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);

            document.open();

            // Font configurations
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.BLACK);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(0, 102, 204));
            Font dateFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY);

            // Title
            Paragraph title = new Paragraph("Rapport de Statistiques du Crédit #" + creditId, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            // Date of generation
            SimpleDateFormat formatter = new SimpleDateFormat("dd/MM/yyyy HH:mm");
            Paragraph dateParagraph = new Paragraph("Généré le: " + formatter.format(new Date()), dateFont);
            dateParagraph.setAlignment(Element.ALIGN_CENTER);
            dateParagraph.setSpacingAfter(30);
            document.add(dateParagraph);

            // Credit Info Section
            Paragraph creditSubtitle = new Paragraph("1. Informations du Crédit", subtitleFont);
            creditSubtitle.setSpacingAfter(15);
            document.add(creditSubtitle);

            Font detailFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Color.BLACK);
            document.add(new Paragraph("Montant: " + credit.getAmount(), detailFont));
            document.add(new Paragraph("Durée (mois): " + credit.getTermMonths(), detailFont));
            document.add(new Paragraph("Taux d'intérêt (%): " + credit.getInterestRate(), detailFont));
            document.add(new Paragraph("Type d'amortissement: " + credit.getRepaymentType().name(), detailFont));
            document.add(new Paragraph("Statut: " + credit.getStatus().name(), detailFont));
            Paragraph padding = new Paragraph(" ");
            padding.setSpacingAfter(20);
            document.add(padding);

            // Echeances Section
            Paragraph echeanceSubtitle = new Paragraph("2. Répartition des Échéances par Statut", subtitleFont);
            echeanceSubtitle.setSpacingAfter(15);
            document.add(echeanceSubtitle);

            // Create Echeance Pie Chart
            DefaultPieDataset<String> echeanceDataset = new DefaultPieDataset<>();
            for (Map.Entry<EcheanceStatus, Long> entry : echeancesByStatus.entrySet()) {
                echeanceDataset.setValue(entry.getKey().name() + " (" + entry.getValue() + ")", entry.getValue());
            }
            JFreeChart echeanceChart = ChartFactory.createPieChart("Répartition des Échéances", echeanceDataset, true,
                    true, false);
            BufferedImage echeanceBImage = echeanceChart.createBufferedImage(500, 400);
            ByteArrayOutputStream echeanceBaos = new ByteArrayOutputStream();
            ImageIO.write(echeanceBImage, "png", echeanceBaos);
            Image echeanceImage = Image.getInstance(echeanceBaos.toByteArray());
            echeanceImage.setAlignment(Element.ALIGN_CENTER);
            echeanceImage.scaleToFit(400, 300);
            echeanceImage.setSpacingAfter(20);
            document.add(echeanceImage);

            // KycLoan Section (Bar Chart)
            Paragraph kycSubtitle = new Paragraph("3. Répartition des Documents KYC par Statut", subtitleFont);
            kycSubtitle.setSpacingAfter(15);
            document.add(kycSubtitle);

            // Create KycLoan Bar Chart
            DefaultCategoryDataset kycDataset = new DefaultCategoryDataset();
            for (Map.Entry<KycStatus, Long> entry : kycLoansByStatus.entrySet()) {
                kycDataset.setValue(entry.getValue(), "Nombre", entry.getKey().name());
            }
            JFreeChart kycChart = ChartFactory.createBarChart(
                    "Statut des Documents KYC",
                    "Statut",
                    "Nombre de Documents",
                    kycDataset,
                    PlotOrientation.VERTICAL,
                    false, true, false);

            CategoryPlot plot = kycChart.getCategoryPlot();
            NumberAxis yAxis = (NumberAxis) plot.getRangeAxis();
            yAxis.setStandardTickUnits(NumberAxis.createIntegerTickUnits());
            
            // Augmenter la marge supérieure pour que les chiffres ne soient pas coupés
            yAxis.setUpperMargin(0.20);  // 20% d'espace au-dessus

            BarRenderer renderer = (BarRenderer) plot.getRenderer();
            renderer.setDefaultItemLabelsVisible(true);
            renderer.setDefaultItemLabelGenerator(new StandardCategoryItemLabelGenerator());
            
            // Améliorer l'affichage des chiffres sur les barres
            renderer.setDefaultItemLabelFont(new java.awt.Font("SansSerif", java.awt.Font.BOLD, 20));

            BufferedImage kycBImage = kycChart.createBufferedImage(500, 350);
            ByteArrayOutputStream kycBaos = new ByteArrayOutputStream();
            ImageIO.write(kycBImage, "png", kycBaos);
            Image kycImage = Image.getInstance(kycBaos.toByteArray());
            kycImage.setAlignment(Element.ALIGN_CENTER);
            kycImage.scaleToFit(450, 350);
            kycImage.setSpacingAfter(20);
            document.add(kycImage);

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new IOException("Erreur lors de la création du document PDF", e);
        }
    }
}
