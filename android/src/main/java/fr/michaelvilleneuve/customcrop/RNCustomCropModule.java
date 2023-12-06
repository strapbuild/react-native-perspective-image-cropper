
package fr.michaelvilleneuve.customcrop;

import fr.michaelvilleneuve.customcrop.ImageProcessor;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.Image;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;

import org.opencv.android.InstallCallbackInterface;
import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.OpenCVLoader;
import org.opencv.android.LoaderCallbackInterface;
import org.opencv.android.Utils;
import org.opencv.core.Core;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.MatOfInt;
import org.opencv.core.MatOfPoint;
import org.opencv.core.MatOfPoint2f;
import org.opencv.core.Point;
import org.opencv.imgcodecs.*;
import org.opencv.core.Rect;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;

import org.opencv.calib3d.Calib3d;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = RNCustomCropModule.NAME)
public class RNCustomCropModule extends ReactContextBaseJavaModule {

  public static final String NAME = "CustomCropManager";
  private final ReactApplicationContext reactContext;
  private static final String TAG = "IMAGECROPPER";

  public RNCustomCropModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;

    BaseLoaderCallback mLoaderCallback = new BaseLoaderCallback(reactContext) {
      @Override
      public void onManagerConnected(int status) {
        if (status == LoaderCallbackInterface.SUCCESS) {
          Log.d(TAG, "SUCCESS init OpenCV: " + status);
        } else {
          Log.d(TAG, "ERROR init OpenCV: " + status);
        }
      }
    };

    if (!OpenCVLoader.initDebug()) {
      OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION, reactContext, mLoaderCallback);
    } else {
      mLoaderCallback.onManagerConnected(LoaderCallbackInterface.SUCCESS);
    }
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void crop(ReadableMap points, String imageUri, Callback callback) {
    Point tl = new Point(points.getMap("topLeft").getDouble("x"), points.getMap("topLeft").getDouble("y"));
    Point tr = new Point(points.getMap("topRight").getDouble("x"), points.getMap("topRight").getDouble("y"));
    Point bl = new Point(points.getMap("bottomLeft").getDouble("x"), points.getMap("bottomLeft").getDouble("y"));
    Point br = new Point(points.getMap("bottomRight").getDouble("x"), points.getMap("bottomRight").getDouble("y"));

    Mat src = Imgcodecs.imread(imageUri.replace("file://", ""), Imgproc.COLOR_BGR2RGB);
    Imgproc.cvtColor(src, src, Imgproc.COLOR_BGR2RGB);

    boolean ratioAlreadyApplied = tr.x * (src.size().width / 500) < src.size().width;
    double ratio = ratioAlreadyApplied ? src.size().width / 500 : 1;

    double widthA = Math.sqrt(Math.pow(br.x - bl.x, 2) + Math.pow(br.y - bl.y, 2));
    double widthB = Math.sqrt(Math.pow(tr.x - tl.x, 2) + Math.pow(tr.y - tl.y, 2));

    double dw = Math.max(widthA, widthB) * ratio;
    int maxWidth = Double.valueOf(dw).intValue();

    double heightA = Math.sqrt(Math.pow(tr.x - br.x, 2) + Math.pow(tr.y - br.y, 2));
    double heightB = Math.sqrt(Math.pow(tl.x - bl.x, 2) + Math.pow(tl.y - bl.y, 2));

    double dh = Math.max(heightA, heightB) * ratio;
    int maxHeight = Double.valueOf(dh).intValue();

    Mat doc = new Mat(maxHeight, maxWidth, CvType.CV_8UC4);

    Mat src_mat = new Mat(4, 1, CvType.CV_32FC2);
    Mat dst_mat = new Mat(4, 1, CvType.CV_32FC2);

    src_mat.put(0, 0, tl.x * ratio, tl.y * ratio, tr.x * ratio, tr.y * ratio, br.x * ratio, br.y * ratio, bl.x * ratio,
        bl.y * ratio);
    dst_mat.put(0, 0, 0.0, 0.0, dw, 0.0, dw, dh, 0.0, dh);

    Mat m = Imgproc.getPerspectiveTransform(src_mat, dst_mat);

    Imgproc.warpPerspective(src, doc, m, doc.size());

    Bitmap bitmap = Bitmap.createBitmap(doc.cols(), doc.rows(), Bitmap.Config.ARGB_8888);
    Utils.matToBitmap(doc, bitmap);

    try {
        File inputFile = new File(imageUri);
        String inputFileName = inputFile.getName();
        String inputFileNameExtension = inputFileName.substring(inputFileName.lastIndexOf("."));
        String inputFileNameWithoutExtension = inputFileName.substring(0, inputFileName.lastIndexOf("."));
        String outputFileName = inputFileNameWithoutExtension + "-cropped" + inputFileNameExtension;
        File outputFile = new File(this.reactContext.getCacheDir(), outputFileName);
        FileOutputStream fileOutputStream = new FileOutputStream(outputFile);

        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, fileOutputStream);
        fileOutputStream.close();

        WritableMap map = Arguments.createMap();
        map.putString("path", outputFile.getPath());
        callback.invoke(null, map);
    } catch (Exception e) {
        Log.e(TAG, e.getMessage(), e);
    }

    m.release();
  }

  @ReactMethod
  public void findDocument(String imageUri, Callback callback) {
    if (!imageUri.isEmpty()) {
      Mat src = Imgcodecs.imread(imageUri.replace("file://", ""));
      Imgproc.cvtColor(src, src, Imgproc.COLOR_BGR2RGB);

      ImageProcessor ip = new ImageProcessor();

      callback.invoke(null, ip.processPicture(src));
    }
  }

  public WritableMap findDocument(Image image, int rotation) {
    Mat mat = null;

    try {
        mat = fr.michaelvilleneuve.helpers.Utils.convertYuvToMat(image);

        Imgcodecs.imwrite("/data/user/0/com.dataccloud.debug/cache/kobian.jpg", mat);
    } catch (Exception e) {
        Log.e(TAG, e.getMessage(), e);
    }

    ImageProcessor ip = new ImageProcessor();

    return ip.processPicture(mat);
  }
}
