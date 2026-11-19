// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Exercise native storage strategies independently of JS matrix snapshots.
#include <RmlUi/Core/Types.h>

#include <cassert>
#include <cmath>
#include <iostream>
#include <type_traits>

namespace {

using ColumnMatrix = Rml::Matrix4f;
using RowMatrix = Rml::Matrix4<float, Rml::RowMajorStorage<float>>;

void Near(float actual, float expected) {
  assert(std::abs(actual - expected) < 0.0001f);
}

template <typename Left, typename Right>
void EqualComponents(const Left& left, const Right& right) {
  for (int row = 0; row < 4; ++row) {
    for (int column = 0; column < 4; ++column) {
      Near(left.GetRow(row)[column], right.GetRow(row)[column]);
    }
  }
}

template <typename Matrix>
void CheckStorage() {
  const float rows[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
  const float columns[] = {
      1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16};
  Matrix matrix = Matrix::FromRowMajor(rows);
  EqualComponents(matrix, Matrix::FromColumnMajor(columns));
  EqualComponents(matrix,
                  Matrix::FromRows(Rml::Vector4f(1, 2, 3, 4),
                                   Rml::Vector4f(5, 6, 7, 8),
                                   Rml::Vector4f(9, 10, 11, 12),
                                   Rml::Vector4f(13, 14, 15, 16)));
  EqualComponents(matrix,
                  Matrix::FromColumns(Rml::Vector4f(1, 5, 9, 13),
                                      Rml::Vector4f(2, 6, 10, 14),
                                      Rml::Vector4f(3, 7, 11, 15),
                                      Rml::Vector4f(4, 8, 12, 16)));
  EqualComponents(matrix, Matrix(matrix));

  const bool column_major = std::is_same_v<typename Matrix::StorageType,
                                           Rml::ColumnMajorStorage<float>>;
  for (int i = 0; i < 16; ++i) {
    assert(matrix.data()[i] == (column_major ? columns[i] : rows[i]));
  }

  const Matrix diagonal = Matrix::Diag(2, 3, 4, 5);
  const Matrix& constant = matrix;
  for (int row = 0; row < 4; ++row) {
    for (int column = 0; column < 4; ++column) {
      assert(diagonal.GetRow(row)[column] == (row == column ? row + 2 : 0));
      assert(constant[row][column] ==
             (column_major ? columns : rows)[row * 4 + column]);
    }
  }
  matrix[1][2] = 27;
  assert(matrix.data()[6] == 27);
  matrix = Matrix::FromRowMajor(rows);

  const auto& transposed = matrix.Transpose();
  assert(transposed.data() == matrix.data());
  for (int row = 0; row < 4; ++row) {
    for (int column = 0; column < 4; ++column) {
      assert(transposed.GetRow(row)[column] == matrix.GetRow(column)[row]);
    }
  }
  EqualComponents(typename Matrix::TransposeType(matrix), matrix);

  matrix.SetRow(1, Rml::Vector4f(20, 21, 22, 23));
  assert(matrix.GetRow(1)[2] == 22);
  matrix.SetColumn(2, Rml::Vector4f(30, 31, 32, 33));
  assert(matrix.GetRow(1)[2] == 31);
  assert(matrix.GetColumn(2)[3] == 33);
  matrix.SetRows(Rml::Vector4f(1, 2, 3, 4),
                 Rml::Vector4f(5, 6, 7, 8),
                 Rml::Vector4f(9, 10, 11, 12),
                 Rml::Vector4f(13, 14, 15, 16));
  EqualComponents(matrix, Matrix::FromRowMajor(rows));
  matrix.SetColumns(Rml::Vector4f(1, 5, 9, 13),
                    Rml::Vector4f(2, 6, 10, 14),
                    Rml::Vector4f(3, 7, 11, 15),
                    Rml::Vector4f(4, 8, 12, 16));
  EqualComponents(matrix, Matrix::FromRowMajor(rows));

  Matrix zero;
  for (int i = 0; i < 16; ++i) {
    assert(zero.data()[i] == 0);
  }
  assert(matrix == matrix && !(matrix != matrix));
  assert(matrix != zero && !(matrix == zero));
  EqualComponents(-(-matrix), matrix);
  EqualComponents((matrix + matrix) - matrix, matrix);

  Matrix divided = matrix;
  divided /= 2.f;
  EqualComponents(divided * 2.f, matrix);
  EqualComponents(matrix / 2.f, divided);
}

void CheckStorageProxies() {
  using Storage = Rml::MatrixStorageBase<float>;
  Storage::VectorsType vectors = {Rml::Vector4f(1, 2, 3, 4),
                                  Rml::Vector4f(5, 6, 7, 8),
                                  Rml::Vector4f(9, 10, 11, 12),
                                  Rml::Vector4f(13, 14, 15, 16)};
  Storage::StrideVector stride(vectors, 1);
  const auto& const_stride = stride;
  const Rml::Vector4f copied = const_stride;
  assert(copied == Rml::Vector4f(2, 6, 10, 14));
  stride = Rml::Vector4f(20, 21, 22, 23);
  assert(vectors[2].y == 22);

  Storage::PackedVector packed(vectors[0]);
  packed = stride;
  assert(vectors[0] == Rml::Vector4f(20, 21, 22, 23));
  Storage::ConstStrideVector const_column(vectors, 2);
  const Rml::Vector4f expected = const_column;
  packed = const_column;
  assert(vectors[0] == expected);
  packed = Rml::Vector4f(3);
  Rml::Vector4f& reference = packed;
  reference.w = 9;
  assert(vectors[0].w == 9 && packed[3] == 9);

  Storage::StrideAccess strides(vectors);
  Storage::ConstStrideAccess const_strides(vectors);
  Storage::PackedAccess rows(vectors);
  Storage::ConstPackedAccess const_rows(vectors);
  assert(strides[3][0] == 9 && const_strides[3][0] == 9);
  assert(rows[0][3] == 9 && const_rows[0][3] == 9);
}

template <typename Matrix, typename Other>
void CheckMixedOperations() {
  const float components[] = {
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
  const Matrix matrix = Matrix::FromRowMajor(components);
  const Other other = Other::FromRowMajor(components);
  assert(matrix == other);
  assert(!(matrix != other));

  Matrix assigned;
  assigned = other;
  EqualComponents(assigned, matrix);
  EqualComponents(matrix + other, matrix * 2.f);
  EqualComponents(matrix - other, Matrix());

  assigned += other;
  EqualComponents(assigned, matrix * 2.f);
  assigned -= other;
  EqualComponents(assigned, matrix);
  Other changed = other;
  changed.GetRow(0)[0] = 99;
  assert(matrix != changed);
  assert(!(matrix == changed));

  const Matrix transposed(matrix.Transpose());
  assigned = matrix;
  assigned = assigned.Transpose();
  EqualComponents(assigned, transposed);
  assigned = matrix;
  assigned += assigned.Transpose();
  EqualComponents(assigned, matrix + transposed);
  assigned = matrix;
  assigned -= assigned.Transpose();
  EqualComponents(assigned, matrix - transposed);
}

template <typename Left, typename Right>
void CheckMultiplication() {
  const float left_values[] = {1, 2, 3, 4, 0, 1, 4, 2, 5, 6, 0, 1, 2, 0, 1, 3};
  const float right_values[] = {3, 1, 0, 2, 4, 2, 1, 0, 1, 0, 2, 4, 0, 3, 1, 1};
  const Left left = Left::FromRowMajor(left_values);
  const Right right = Right::FromRowMajor(right_values);
  const auto result = left * right;

  for (int row = 0; row < 4; ++row) {
    for (int column = 0; column < 4; ++column) {
      float expected = 0;
      for (int k = 0; k < 4; ++k) {
        expected += left_values[row * 4 + k] * right_values[k * 4 + column];
      }
      Near(result.GetRow(row)[column], expected);
    }
  }

  Left in_place = left;
  in_place *= right;
  EqualComponents(in_place, result);

  const Rml::Vector4f vector(1, 2, 3, 4);
  const auto transformed = left * vector;
  for (int row = 0; row < 4; ++row) {
    Near(transformed[row],
         left_values[row * 4] + 2 * left_values[row * 4 + 1] +
             3 * left_values[row * 4 + 2] + 4 * left_values[row * 4 + 3]);
  }
}

template <typename Matrix>
void CheckInversion() {
  Matrix matrix = Matrix::Translate(7, -4, 2) * Matrix::Scale(2, 3, 4);
  Near(matrix.Determinant(), 24);
  Matrix inverse = matrix;
  assert(inverse.Invert());
  EqualComponents(matrix * inverse, Matrix::Identity());
  EqualComponents(inverse * matrix, Matrix::Identity());

  Matrix singular = Matrix::Scale(0, 3, 4);
  const Matrix before = singular;
  assert(singular.Determinant() == 0);
  assert(!singular.Invert());
  EqualComponents(singular, before);
}

template <typename Matrix>
void CheckTransforms() {
  const Rml::Vector4f origin(0, 0, 0, 1);
  const Rml::Vector4f point(1, 2, 3, 1);
  assert(Matrix::Translate(Rml::Vector3f(7, 8, 9)) * origin ==
         Rml::Vector4f(7, 8, 9, 1));
  assert(Matrix::TranslateX(7) * origin == Rml::Vector4f(7, 0, 0, 1));
  assert(Matrix::TranslateY(8) * origin == Rml::Vector4f(0, 8, 0, 1));
  assert(Matrix::TranslateZ(9) * origin == Rml::Vector4f(0, 0, 9, 1));
  assert(Matrix::ScaleX(2) * point == Rml::Vector4f(2, 2, 3, 1));
  assert(Matrix::ScaleY(3) * point == Rml::Vector4f(1, 6, 3, 1));
  assert(Matrix::ScaleZ(4) * point == Rml::Vector4f(1, 2, 12, 1));

  const float half_pi = Rml::Math::RMLUI_PI / 2;
  EqualComponents(Matrix::Rotate(Rml::Vector3f(2, 0, 0), half_pi),
                  Matrix::RotateX(half_pi));
  EqualComponents(Matrix::Rotate(Rml::Vector3f(0, 2, 0), half_pi),
                  Matrix::RotateY(half_pi));
  EqualComponents(Matrix::Rotate(Rml::Vector3f(0, 0, 2), half_pi),
                  Matrix::RotateZ(half_pi));
  const auto rotated = Matrix::RotateZ(half_pi) * Rml::Vector4f(1, 0, 0, 1);
  Near(rotated.x, 0);
  Near(rotated.y, 1);

  const auto rotated_x = Matrix::RotateX(half_pi) * Rml::Vector4f(0, 1, 0, 1);
  const auto rotated_y = Matrix::RotateY(half_pi) * Rml::Vector4f(0, 0, 1, 1);
  Near(rotated_x.y, 0);
  Near(rotated_x.z, 1);
  Near(rotated_y.x, 1);
  Near(rotated_y.z, 0);

  EqualComponents(Matrix::SkewX(0.25f), Matrix::Skew(0.25f, 0));
  EqualComponents(Matrix::SkewY(0.25f), Matrix::Skew(0, 0.25f));
  Near(Matrix::Perspective(8).GetRow(3)[2], -0.125f);

  const auto ortho = Matrix::ProjectOrtho(-2, 2, -4, 4, -8, 8);
  Near((ortho * Rml::Vector4f(2, 4, 8, 1)).x, 1);
  Near((ortho * Rml::Vector4f(2, 4, 8, 1)).y, 1);
  Near((ortho * Rml::Vector4f(2, 4, 8, 1)).z, 1);

  const auto perspective = Matrix::ProjectPerspective(-1, 1, -1, 1, 1, 9);
  const auto near_plane = perspective * Rml::Vector4f(0, 0, -1, 1);
  const auto far_plane = perspective * Rml::Vector4f(0, 0, -9, 1);
  Near(near_plane.z / near_plane.w, -1);
  Near(far_plane.z / far_plane.w, 1);

  const auto composed = Matrix::Compose(Rml::Vector3f(7, 8, 9),
                                        Rml::Vector3f(2, 3, 4),
                                        Rml::Vector3f(0.25f, 0.5f, 0.75f),
                                        Rml::Vector4f(0, 0, 0, 1),
                                        Rml::Vector4f(0, 0, 0, 1));
  const auto expected = ColumnMatrix::FromRows(Rml::Vector4f(2, 0.75f, 2, 7),
                                               Rml::Vector4f(0, 3, 3, 8),
                                               Rml::Vector4f(0, 0, 4, 9),
                                               Rml::Vector4f(0, 0, 0, 1));
  EqualComponents(composed, expected);

  const float quaternion_component = std::sqrt(0.5f);
  const auto projected = Matrix::Compose(
      Rml::Vector3f(7, 8, 9),
      Rml::Vector3f(2, 3, 4),
      Rml::Vector3f(0),
      Rml::Vector4f(0.1f, 0.2f, 0.3f, 1),
      Rml::Vector4f(0, 0, quaternion_component, quaternion_component));
  const auto projected_expected =
      ColumnMatrix::FromRows(Rml::Vector4f(0, -3, 0, 7),
                             Rml::Vector4f(2, 0, 0, 8),
                             Rml::Vector4f(0, 0, 4, 9),
                             Rml::Vector4f(0.4f, -0.3f, 1.2f, 6));
  EqualComponents(projected, projected_expected);
}

}  // namespace

int main() {
  CheckStorageProxies();
  std::cout << "PASS matrix-packed-strided-proxy-and-const-conversion\n";

  CheckStorage<ColumnMatrix>();
  CheckStorage<RowMatrix>();
  std::cout << "PASS matrix-row-column-storage-and-transpose-alias\n";

  CheckMixedOperations<ColumnMatrix, RowMatrix>();
  CheckMixedOperations<RowMatrix, ColumnMatrix>();
  std::cout << "PASS matrix-cross-storage-assignment-arithmetic-and-equality\n";

  CheckMultiplication<ColumnMatrix, ColumnMatrix>();
  CheckMultiplication<ColumnMatrix, RowMatrix>();
  CheckMultiplication<RowMatrix, ColumnMatrix>();
  CheckMultiplication<RowMatrix, RowMatrix>();
  std::cout << "PASS matrix-four-storage-multiplication-combinations\n";

  CheckInversion<ColumnMatrix>();
  CheckInversion<RowMatrix>();
  std::cout << "PASS matrix-inverse-and-singular-destination-preservation\n";

  CheckTransforms<ColumnMatrix>();
  CheckTransforms<RowMatrix>();
  std::cout << "PASS matrix-native-projection-rotation-skew-and-translation\n";
}
